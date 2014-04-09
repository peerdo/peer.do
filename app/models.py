from django.db import models, transaction
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from sorl.thumbnail import ImageField
from app.utils import BTCField, PositiveBigIntegerField, RandomIDModel

class Fund(RandomIDModel):
    starter = models.ForeignKey('auth.User', related_name='owned_funds')
    backers = models.ManyToManyField('auth.User', related_name='funds')
    title = models.CharField(max_length=255, required=True)
    image = ImageField()
    rubric = models.TextField()
    minimum_stake = BTCField(default=0)
    created = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    url = models.URLField(blank=True)
    is_private = models.BooleanField(default=True)
    allow_non_starter_bids = models.BooleanField(default=True)
    backer_only = models.BooleanField(default=False)
    winner = models.ForeignKey('Bid', blank=True, null=True)
    #fund_page = models.ForeignKey('FundPage', blank=True, null=True)
    #tags = models.ManyToManyField('Tag', related_name='tags')

class FundWallet(models.Model):
    fund = models.OneToOneField('Fund')

class FundWalletPayment(models.Model):
    wallet = models.ForeignKey('FundWallet', related_name='payments')
    amount = BTCField()
    user = models.ForeignKey('auth.User', related_name='fund_wallet_payments')

class Bid(RandomIDModel):
    user = models.ForeignKey('auth.User')
    title = models.CharField(max_length=255, required=True)
    description = models.TextField()
    fund = models.ForeignKey('Fund')


class Comment(RandomIDModel):
    content_type = models.ForeignKey(ContentType)
    object_id = models.PositiveBigIntegerField()
    content_object = GenericForeignKey()

    user = models.ForeignKey('auth.User')
    created = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=1, choices=[
        ('C', 'Comment'),
        ('F', 'Flag'),
        ('W', 'Work notification')
    ])
    content = models.TextField()


class UserProfile(models.Model):
    user = models.OneToOneField('auth.User')
    public_key = models.TextField() #todo?
    btc_address = models.CharField(max_length=30)