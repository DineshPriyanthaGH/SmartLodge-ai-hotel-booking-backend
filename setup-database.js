#!/usr/bin/env node

/**
 * Smart Lodge Database Setup and Testing Script
 * 
 * This script helps set up and test the MongoDB database integration
 * for the Smart Lodge Hotel Booking System.
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('🏨 Smart Lodge Database Setup Script');
console.log('====================================');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not set!');
  console.log('   Please add MONGODB_URI to your .env file');
  console.log('   Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smartlodge-dev');
  process.exit(1);
}

async function setupDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('smartlodge-dev');
    console.log('✅ Connected to MongoDB successfully');
    
    // Test basic connectivity
    await db.admin().ping();
    console.log('🏓 Database ping successful');
    
    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Existing collections:', collections.map(c => c.name));
    
    // Create required collections
    const requiredCollections = ['hotels', 'rooms', 'bookings', 'users', 'admins', 'reviews'];
    
    for (const collectionName of requiredCollections) {
      const exists = collections.some(c => c.name === collectionName);
      if (!exists) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } else {
        console.log(`📁 Collection exists: ${collectionName}`);
      }
    }
    
    // Check data counts
    console.log('\n📊 Data Summary:');
    for (const collection of requiredCollections) {
      const count = await db.collection(collection).countDocuments();
      console.log(`   ${collection}: ${count} documents`);
    }
    
    // Test admin API simulation
    console.log('\n🔧 Testing Admin Operations:');
    
    // Test hotel creation
    const testHotel = {
      _id: 'test_hotel_' + Date.now(),
      name: 'Database Test Hotel',
      location: {
        city: 'Test City',
        state: 'TC',
        country: 'USA',
        address: '123 Test Street',
        zipCode: '12345'
      },
      rating: { overall: 4.5, reviewCount: 10 },
      pricing: { basePrice: 150, currency: 'USD' },
      images: [],
      amenities: [{ name: 'Free WiFi', icon: 'wifi' }],
      description: 'A test hotel for database integration',
      featured: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const insertResult = await db.collection('hotels').insertOne(testHotel);
    console.log('✅ Test hotel created:', insertResult.insertedId);
    
    // Test hotel retrieval
    const retrievedHotel = await db.collection('hotels').findOne({ _id: testHotel._id });
    console.log('✅ Test hotel retrieved:', retrievedHotel.name);
    
    // Test hotel update
    await db.collection('hotels').updateOne(
      { _id: testHotel._id },
      { $set: { description: 'Updated test description', updatedAt: new Date().toISOString() } }
    );
    console.log('✅ Test hotel updated');
    
    // Test hotel deletion
    await db.collection('hotels').deleteOne({ _id: testHotel._id });
    console.log('✅ Test hotel deleted');
    
    // Create indexes for performance
    console.log('\n🔍 Creating database indexes...');
    
    await db.collection('hotels').createIndex({ status: 1 });
    await db.collection('hotels').createIndex({ 'location.city': 1 });
    await db.collection('hotels').createIndex({ featured: 1 });
    await db.collection('hotels').createIndex({ name: 'text', description: 'text' });
    
    await db.collection('bookings').createIndex({ userId: 1 });
    await db.collection('bookings').createIndex({ hotelId: 1 });
    await db.collection('bookings').createIndex({ status: 1 });
    
    await db.collection('rooms').createIndex({ hotelId: 1 });
    await db.collection('rooms').createIndex({ available: 1 });
    
    console.log('✅ Database indexes created');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Test admin panel: http://localhost:5000/admin');
    console.log('   3. Test public API: http://localhost:5000/api/hotels');
    console.log('   4. Admin credentials: username=admin, password=admin123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupDatabase().catch(console.error);