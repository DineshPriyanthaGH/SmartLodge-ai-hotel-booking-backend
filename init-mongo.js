// MongoDB initialization script for local development
db = db.getSiblingDB('smartlodge');

// Create application user
db.createUser({
  user: 'smartlodge_user',
  pwd: 'smartlodge_password',
  roles: [
    {
      role: 'readWrite',
      db: 'smartlodge'
    }
  ]
});

// Create collections with indexes
db.createCollection('users');
db.createCollection('hotels');
db.createCollection('bookings');
db.createCollection('reviews');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "clerkUserId": 1 }, { unique: true });
db.hotels.createIndex({ "name": 1 });
db.hotels.createIndex({ "location.city": 1 });
db.hotels.createIndex({ "location.coordinates": "2dsphere" });
db.bookings.createIndex({ "userId": 1 });
db.bookings.createIndex({ "hotelId": 1 });
db.bookings.createIndex({ "checkInDate": 1 });
db.reviews.createIndex({ "hotelId": 1 });
db.reviews.createIndex({ "userId": 1 });

print('SmartLodge database initialized successfully!');