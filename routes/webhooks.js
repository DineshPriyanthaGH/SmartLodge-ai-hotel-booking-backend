const express = require('express');
const { Webhook } = require('svix');
const User = require('../models/User');
const router = express.Router();

// Clerk webhook endpoint
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get the headers and body
    const headers = req.headers;
    const payload = req.body;

    // Verify the webhook signature
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    let evt;

    try {
      evt = wh.verify(payload, headers);
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Handle the webhook event
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook received: ${eventType}`);

    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

// Handle user created event
async function handleUserCreated(userData) {
  try {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = userData;

    const existingUser = await User.findOne({ clerkId: id });
    if (existingUser) {
      console.log(`User with clerkId ${id} already exists`);
      return;
    }

    const user = new User({
      clerkId: id,
      email: email_addresses[0]?.email_address || '',
      firstName: first_name || '',
      lastName: last_name || '',
      profileImage: image_url || '',
      role: public_metadata?.role || 'user',
      isActive: true,
      verificationStatus: {
        email: email_addresses[0]?.verification?.status === 'verified' || false,
        phone: false,
        identity: false
      }
    });

    await user.save();
    console.log(`User created in database with clerkId: ${id}`);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Handle user updated event
async function handleUserUpdated(userData) {
  try {
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = userData;

    const user = await User.findOne({ clerkId: id });
    if (!user) {
      console.log(`User with clerkId ${id} not found, creating new user`);
      await handleUserCreated(userData);
      return;
    }

    // Update user data
    user.email = email_addresses[0]?.email_address || user.email;
    user.firstName = first_name || user.firstName;
    user.lastName = last_name || user.lastName;
    user.profileImage = image_url || user.profileImage;
    user.role = public_metadata?.role || user.role;
    user.verificationStatus.email = email_addresses[0]?.verification?.status === 'verified' || user.verificationStatus.email;

    await user.save();
    console.log(`User updated in database with clerkId: ${id}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Handle user deleted event
async function handleUserDeleted(userData) {
  try {
    const { id } = userData;

    const user = await User.findOne({ clerkId: id });
    if (!user) {
      console.log(`User with clerkId ${id} not found for deletion`);
      return;
    }

    // Soft delete - set isActive to false
    user.isActive = false;
    await user.save();

    console.log(`User soft deleted in database with clerkId: ${id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

module.exports = router;