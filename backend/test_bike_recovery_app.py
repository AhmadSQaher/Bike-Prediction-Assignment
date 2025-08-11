"""
Unit Tests for Bike Recovery AI Application

This file contains exactly 5 unit tests for the bike recovery prediction system:
1. test_get_user() - User retrieval functionality
2. test_create_user() - User creation functionality  
3. test_generate_advice() - Prediction advice generation
4. test_update_user() - User profile update functionality
5. test_send_reset_email() - Password reset email functionality

Test Framework: pytest
Mocking: unittest.mock for external dependencies

To run tests:
    pip install pytest pytest-mock
    python -m pytest test_bike_recovery_app.py -v
"""

from unittest.mock import patch, MagicMock
import sys
import os

# Add the backend directory to Python path for imports
sys.path.insert(0, os.path.dirname(__file__))

# Try to import pytest, but make it optional
try:
    import pytest
    PYTEST_AVAILABLE = True
except ImportError:
    PYTEST_AVAILABLE = False


class TestBikeRecoveryApp:
    """Test suite for Bike Recovery AI Application - 5 Essential Functions"""
    
    def setup_method(self):
        """Setup method called before each test"""
        # Sample test data
        self.sample_user = {
            'email': 'test@example.com',
            'password': '$2b$12$hashed_password_here',
            'name': 'Test User',
            'role': 'user',
            'created_at': '2024-01-01T00:00:00'
        }

    # TEST 1: get_user() Function
    
    def test_get_user(self):
        """Test 1: User retrieval from MongoDB"""
        with patch('app.users_collection') as mock_collection:
            # Arrange
            mock_collection.find_one.return_value = self.sample_user
            
            from app import get_user
            
            # Act
            result = get_user('test@example.com')
            
            # Assert
            assert result == self.sample_user
            mock_collection.find_one.assert_called_once_with({'email': 'test@example.com'})
            print("✅ TEST 1 PASSED: get_user() successfully retrieves user from database")

    # TEST 2: create_user() Function
    
    def test_create_user(self):
        """Test 2: User creation in MongoDB"""
        with patch('app.users_collection') as mock_collection, \
             patch('app.generate_password_hash') as mock_hash:
            # Arrange
            mock_hash.return_value = 'hashed_password'
            mock_collection.insert_one.return_value = MagicMock()
            
            from app import create_user
            
            # Act
            result = create_user('new@example.com', 'password123', 'New User', 'user')
            
            # Assert
            assert result is True
            mock_collection.insert_one.assert_called_once()
            call_args = mock_collection.insert_one.call_args[0][0]
            assert call_args['email'] == 'new@example.com'
            assert call_args['name'] == 'New User'
            assert call_args['role'] == 'user'
            assert call_args['password'] == 'hashed_password'
            print("✅ TEST 2 PASSED: create_user() successfully creates new user with hashed password")

    # TEST 3: generate_advice() Function
    
    def test_generate_advice(self):
        """Test 3: Prediction advice generation"""
        from app import generate_advice
        
        # Arrange
        prediction = 1
        probability = [0.2, 0.8]  # 80% recovery chance (high probability)
        input_data = {'DIVISION': 1, 'OCC_DOW': 3, 'BIKE_TYPE': 2}
        
        # Act
        advice = generate_advice(prediction, probability, input_data)
        
        # Assert
        assert isinstance(advice, list)
        assert len(advice) > 0
        assert any('High recovery probability' in item for item in advice)
        assert any('Report the theft immediately' in item for item in advice)
        print("✅ TEST 3 PASSED: generate_advice() creates appropriate advice for high probability scenario")

    # TEST 4: update_user() Function
    
    def test_update_user(self):
        """Test 4: User profile update in MongoDB"""
        with patch('app.users_collection') as mock_collection:
            # Arrange
            mock_collection.update_one.return_value = MagicMock()
            updates = {'name': 'Updated Name', 'role': 'admin'}
            
            from app import update_user
            
            # Act
            result = update_user('test@example.com', updates)
            
            # Assert
            assert result is True
            mock_collection.update_one.assert_called_once_with(
                {'email': 'test@example.com'}, 
                {'$set': updates}
            )
            print("✅ TEST 4 PASSED: update_user() successfully updates user profile in database")

    # TEST 5: send_reset_email() Function
    
    def test_send_reset_email(self):
        """Test 5: Password reset email sending"""
        with patch('app.smtplib.SMTP') as mock_smtp, \
             patch('app.MIMEMultipart') as mock_mime:
            # Arrange
            mock_server = MagicMock()
            mock_smtp.return_value = mock_server
            
            from app import send_reset_email
            
            # Act
            result = send_reset_email('test@example.com', 'reset_token_123', 'Test User')
            
            # Assert
            assert result is True
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once()
            mock_server.sendmail.assert_called_once()
            mock_server.quit.assert_called_once()
            print("✅ TEST 5 PASSED: send_reset_email() successfully sends password reset email via SMTP")


# Test Runner

if __name__ == '__main__':

    # Run the 5 unit tests directly Use: python test_bike_recovery_app.py
    print("🚴 Bike Recovery AI - 5 Essential Unit Tests")
    print("=" * 60)
    print("Testing exactly 5 core functions:")
    print("1. get_user() - Database user retrieval")
    print("2. create_user() - User account creation") 
    print("3. generate_advice() - AI prediction advice")
    print("4. update_user() - Profile updates")
    print("5. send_reset_email() - Password reset emails")
    print("=" * 60)
    
    # Run with pytest if available
    if PYTEST_AVAILABLE:
        try:
            import pytest
            pytest.main([__file__, '-v', '--tb=short'])
        except Exception as e:
            print(f"❌ Error running pytest: {e}")
            print("✅ Falling back to manual test execution...")
            PYTEST_AVAILABLE = False
    
    if not PYTEST_AVAILABLE:
        print("✅ Running tests manually (pytest not available)...")
        
        # Create test instance and run manually
        test_instance = TestBikeRecoveryApp()
        test_instance.setup_method()
        
        tests_passed = 0
        total_tests = 5
        
        try:
            # Run each test manually
            test_instance.test_get_user()
            tests_passed += 1
            
            test_instance.test_create_user() 
            tests_passed += 1
            
            test_instance.test_generate_advice()
            tests_passed += 1
            
            test_instance.test_update_user()
            tests_passed += 1
            
            test_instance.test_send_reset_email()
            tests_passed += 1
            
            print(f"\n🎉 ALL {tests_passed}/{total_tests} TESTS COMPLETED SUCCESSFULLY!")
            
        except Exception as e:
            print(f"\n❌ TEST FAILED: {e}")
            print(f"Tests passed: {tests_passed}/{total_tests}")
            
    print("\n📋 Test Summary:")
    print("- Total Functions Tested: 5")
    print("- Backend Functions: 5 (Database & Email)")
    print("- Test Framework: pytest with unittest.mock")
    print("- Mocking: MongoDB collections and SMTP servers")
