#!/usr/bin/env python3
"""
Environment Setup Script for Email Configuration
This script helps set up the .env file for email configuration
"""

import os

def create_env_file():
    """Create or update .env file with email configuration"""
    
    env_file_path = ".env"
    
    print("🔧 Setting up email environment configuration...")
    
    # Get email credentials from user
    print("\n📧 Enter your Gmail credentials:")
    email = input("Gmail address (default: cabdixakiincuumar43@gmail.com): ").strip()
    if not email:
        email = "cabdixakiincuumar43@gmail.com"
    
    print(f"\n🔑 For Gmail, you need an App Password (not your regular password)")
    print("📝 If you don't have one yet, leave this blank and follow the setup instructions")
    app_password = input("Gmail App Password: ").strip()
    
    # Create .env content
    env_content = f"""# RentSystem Email Configuration
MAIL_USERNAME={email}
MAIL_PASSWORD={app_password}

# Other configuration
SECRET_KEY=supersecretkey
FLASK_APP=app
FLASK_ENV=development
"""
    
    try:
        # Write .env file
        with open(env_file_path, 'w') as f:
            f.write(env_content)
        
        print(f"\n✅ .env file created successfully at: {os.path.abspath(env_file_path)}")
        
        if app_password:
            print("🔐 Email configuration is ready!")
            print("🧪 You can now test with: python test_email_config.py")
        else:
            print("⚠️  App Password not set. Please:")
            print("1. Follow the setup instructions in test_email_config.py")
            print("2. Update the .env file with your App Password")
            print("3. Test the configuration")
            
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        print("📝 Please create the .env file manually with the following content:")
        print("\n" + "="*50)
        print(env_content)
        print("="*50)

def show_setup_instructions():
    """Show detailed setup instructions"""
    print("\n" + "="*70)
    print("📧 DETAILED GMAIL SMTP SETUP INSTRUCTIONS")
    print("="*70)
    
    print("\n🔐 STEP 1: Enable 2-Step Verification")
    print("   - Go to: https://myaccount.google.com/security")
    print("   - Find '2-Step Verification' and click 'Get started'")
    print("   - Follow the steps to enable it")
    print("   - This is required to generate App Passwords")
    
    print("\n🔑 STEP 2: Generate App Password")
    print("   - Go to: https://myaccount.google.com/apppasswords")
    print("   - Sign in with your Google account")
    print("   - Select 'Mail' from the 'Select app' dropdown")
    print("   - Select 'Other (Custom name)' from 'Select device'")
    print("   - Enter 'RentSystem' as the name")
    print("   - Click 'Generate'")
    print("   - Copy the 16-character password (it looks like: abcd efgh ijkl mnop)")
    
    print("\n📝 STEP 3: Update Configuration")
    print("   - The .env file has been created")
    print("   - Update MAIL_PASSWORD with your App Password")
    print("   - Remove spaces from the App Password")
    
    print("\n🧪 STEP 4: Test Configuration")
    print("   - Run: python test_email_config.py")
    print("   - Enter your App Password when prompted")
    print("   - Check if test email is received")
    
    print("\n⚠️  IMPORTANT NOTES:")
    print("   - Never use your regular Gmail password")
    print("   - App Passwords are 16 characters long")
    print("   - Keep your .env file secure and don't commit it to git")
    print("   - If you change your Google password, you'll need a new App Password")
    
    print("="*70)

if __name__ == "__main__":
    print("🚀 RentSystem Email Environment Setup")
    print("="*40)
    
    create_env_file()
    show_setup_instructions()
    
    print("\n🎯 Next steps:")
    print("1. Follow the setup instructions above")
    print("2. Update your .env file with the App Password")
    print("3. Test the email configuration")
    print("4. Restart your Flask application")








