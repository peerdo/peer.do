from django.db import models

class BTCField(models.DecimalField):
    def __init__(self, *args, **kwargs):
        super(self, BTCField).__init__(max_digits=17, decimal_places=8)

# Create your models here.
class Fund(models.Model):
    manager = models.ForeignKey('auth.User', related_name='owned_funds')
    backers = models.ManyToManyField('auth.User', related_name='funds')
    title = models.CharField(max_length=255, required=True)
    rubric = models.TextField()
    minimum_stake = BTCField()
    created = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    url = models.URLField()
    initial_stake = models.BTCField()
    is_private = models.BooleanField(default=True) 
    backer_only = models.BooleanField(default=False)
    tags = models.ManyToManyField('Tag', related_name='tags')
    winner = models.ForeignKey('Bid', blank=True, null=True)

class Tag(models.Model):
    name = models.CharField(max_length=50)

class Bid(models.Model):
    user = models.ForeignKey('auth.User')
    title = models.CharField(max_length=255, required=True)
    description = models.TextField()
    fund = models.ForeignKey('Fund')




class Comment(models.Model):
    user = models.ForeignKey('auth.User')
    created = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    fund = models.ForeignKey('Fund')

class UserProfile(models.Model):
    user = models.OneToOneField('auth.User')
    public_key = models.TextField() #todo?
    btc_address = models.CharField(max_length=30)


class Transaction(models.Model):
    amount = BTCField()
    timestamp = BTCField()


