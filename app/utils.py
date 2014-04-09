from django.db import models, transaction

class BTCField(models.DecimalField):
    def __init__(self, *args, **kwargs):
        super(self, BTCField).__init__(max_digits=17, decimal_places=8)

class PositiveBigIntegerField(BigIntegerField):
    empty_strings_allowed = False
    description = _("Big (64-bit) positive integer")

    def db_type(self, connection):
        """
        Returns MySQL-specific column data type. Make additional checks
        to support other backends.
        """
        return 'bigint UNSIGNED'

    def formfield(self, **kwargs):
        defaults = {'min_value': 0,
                    'max_value': BigIntegerField.MAX_BIGINT * 2 - 1}
        defaults.update(kwargs)
        return super(PositiveBigIntegerField, self).formfield(**defaults)

class RandomIDModel(models.Model):
    id = PositiveBigIntegerField()

    class Meta:
        abstract = True

    def save(*args, **kwargs):
        # Adapted from <https://github.com/jbrendel/django-randomprimary/blob/bbeb96b/random_primary.py>
        # IntegrityError handling could be improved!
        if self.id is not None:
            return super(RandomIDModel, self).save(*args, **kwargs)

        while True:
            _id = self._get_random_id()
            sid = transaction.savepoint() # Needed for Postgres
            try:
                if kwargs is None:
                    kwargs = dict()
                # If force_insert is already present in kwargs, we want to make sure it's overwritten.
                # Also, by putting it here we can be sure we don't accidentally specify it twice.
                kwargs['force_insert'] = True           
                self.id = _id
                super(RandomIDModel, self).save(*args, **kwargs)
                break
            except IntegrityError, e:
                msg = e.args[-1]
                if msg.endswith("for key 'PRIMARY'") or msg == "column id is not unique" or \
                        "Key (id)=" in msg:
                    transaction.savepoint_rollback(sid) 
                    # Needs to be done for Postgres, since otherwise the whole transaction is cancelled, if this is part of a larger transaction.
                else:
                    # Some other IntegrityError? Need to re-raise it...
                    raise e
