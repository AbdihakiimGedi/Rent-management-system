# Quick Setup Guide - Fix 500 Error for Owner Requirements

## 🚨 Current Issue
You're getting a 500 Internal Server Error when trying to access `/admin/owner-requirements`. This is because the database table doesn't exist yet.

## ✅ Solution Steps

### Step 1: Run Database Migration
In your PowerShell terminal, navigate to the Backend directory and run:

```powershell
cd Backend
alembic upgrade head
```

This will create the `owner_requirements` table in your database.

### Step 2: Verify Migration Success
You should see output like:
```
INFO  [alembic.runtime.migration] Context impl MySQLImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade 566ac60ef60a -> add_owner_requirements_table
```

### Step 3: Test Database Connection (Optional)
Run the test script to verify everything is working:

```powershell
python test_owner_requirements.py
```

You should see:
```
✅ Database connection successful
✅ Owner requirements table exists with 0 records
✅ All tests passed! Database is ready.
```

### Step 4: Restart Your Backend Server
Stop your Flask server (Ctrl+C) and restart it:

```powershell
python run.py
```

### Step 5: Test the Frontend
1. Navigate to `/admin/owner-requirements` in your browser
2. You should now see the requirements management interface
3. Try creating a test requirement

## 🔍 If You Still Get Errors

### Check Migration Status
```powershell
alembic current
alembic history
```

### Check Database Tables
Connect to your MySQL database and verify:
```sql
SHOW TABLES LIKE 'owner_requirements';
DESCRIBE owner_requirements;
```

### Check Backend Logs
Look for error messages in your Flask server console when you try to access the endpoint.

## 📋 Expected Behavior After Fix

1. **Admin Dashboard**: Should show "Owner Requirements" button in Quick Actions
2. **Requirements Page**: Should load without errors and show empty state
3. **Create Form**: Should allow you to add new requirement fields
4. **Owner Application Form**: Should dynamically load admin-defined fields

## 🆘 Still Having Issues?

1. **Check the test script output** for specific error messages
2. **Verify your database connection** in `Backend/app/config.py`
3. **Check if the migration file exists** in `Backend/migrations/versions/`
4. **Look for import errors** in your Flask server console

## 🎯 Next Steps After Fix

1. Create some sample requirements (Business Plan, Experience, etc.)
2. Test the owner application form
3. Verify all CRUD operations work
4. Test field reordering functionality

---

**Note**: The 500 error is expected until you run the migration. This is a safety feature to prevent the app from crashing when the required database structure doesn't exist.



