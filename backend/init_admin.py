#!/usr/bin/env python3
"""
Script to initialize an admin user in MongoDB
Run this script to create the first admin user for your application
"""

from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime
import getpass

# MongoDB configuration
MONGO_URI = "mongodb+srv://sqaher:LR3iKYVjY3yQqdPt@centennialcollegecluste.rkaeskw.mongodb.net/"
DB_NAME = "bike_recovery_ai"

def create_admin_user():
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users_collection = db.users
        
        print("🚴 Bike Recovery AI - Admin User Setup")
        print("=" * 40)
        
        # Get admin user details
        email = input("Enter admin email: ").strip()
        if not email:
            print("❌ Email is required!")
            return False
            
        name = input("Enter admin name: ").strip()
        if not name:
            name = "Admin"
            
        password = getpass.getpass("Enter admin password: ").strip()
        if not password:
            print("❌ Password is required!")
            return False
            
        confirm_password = getpass.getpass("Confirm admin password: ").strip()
        if password != confirm_password:
            print("❌ Passwords don't match!")
            return False
        
        # Check if user already exists
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return False
        
        # Create admin user
        admin_user = {
            'email': email,
            'password': generate_password_hash(password),
            'name': name,
            'role': 'admin',
            'created_at': datetime.now().isoformat()
        }
        
        # Insert into database
        result = users_collection.insert_one(admin_user)
        
        if result.inserted_id:
            print(f"✅ Admin user created successfully!")
            print(f"   Email: {email}")
            print(f"   Name: {name}")
            print(f"   Role: admin")
            print(f"   Created: {admin_user['created_at']}")
            return True
        else:
            print("❌ Failed to create admin user!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

def main():
    print("Setting up MongoDB admin user...")
    success = create_admin_user()
    
    if success:
        print("\n🎉 Setup completed successfully!")
        print("You can now start the Flask application and login with your admin credentials.")
    else:
        print("\n💥 Setup failed!")
        print("Please check the error messages above and try again.")

if __name__ == "__main__":
    main()
