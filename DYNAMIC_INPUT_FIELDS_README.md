# Dynamic Input Fields for Owner Applications

This document describes the implementation of dynamic input fields for owner application forms in the RentSystem. This feature allows administrators to define custom form fields that owners must fill out when applying for owner privileges.

## Overview

The system now supports:
- **Admin-defined form fields** with various input types (text, textarea, number, dropdown, file, date, email, phone)
- **Dynamic form rendering** based on admin configuration
- **Full CRUD operations** for managing form requirements
- **Flexible validation** and field ordering
- **Real-time form updates** without code changes

## Architecture

### Backend Components

#### 1. Database Model (`OwnerRequirement`)
- **Location**: `Backend/app/models/owner_requirement.py`
- **Table**: `owner_requirements`
- **Key Fields**:
  - `label`: Human-readable field label
  - `field_name`: Unique identifier for the field
  - `input_type`: Type of input (text, textarea, number, dropdown, file, date, email, phone)
  - `is_required`: Whether the field is mandatory
  - `placeholder`: Optional placeholder text
  - `help_text`: Optional help text for users
  - `options`: JSON array for dropdown options
  - `validation_rules`: JSON object for validation rules
  - `order_index`: Field ordering in the form
  - `is_active`: Soft delete flag

#### 2. API Routes

##### Admin Routes (`/admin/owner-requirements`)
- `GET /admin/owner-requirements` - List all requirements
- `POST /admin/owner-requirements` - Create new requirement
- `PUT /admin/owner-requirements/:id` - Update requirement
- `DELETE /admin/owner-requirements/:id` - Soft delete requirement
- `POST /admin/owner-requirements/reorder` - Reorder requirements

##### Owner Routes (`/owner/requirements`)
- `GET /owner/requirements` - Get requirements for application form

#### 3. Database Migration
- **File**: `Backend/migrations/versions/add_owner_requirements_table.py`
- **Run with**: `alembic upgrade head`

### Frontend Components

#### 1. Admin Management Interface
- **Location**: `frontend/src/pages/admin/OwnerRequirements.jsx`
- **Features**:
  - Add/edit/delete form fields
  - Configure input types and validation
  - Drag-and-drop reordering
  - Real-time preview

#### 2. Dynamic Owner Application Form
- **Location**: `frontend/src/pages/owner/OwnerRequestForm.jsx`
- **Features**:
  - Automatically loads admin-defined fields
  - Renders appropriate input types
  - Handles validation and submission
  - Responsive design

#### 3. Admin Dashboard Integration
- **Location**: `frontend/src/pages/dashboards/AdminDashboard.jsx`
- **Features**:
  - Quick access button to requirements management
  - Overview of current configuration

## Usage Guide

### For Administrators

#### 1. Access Requirements Management
1. Navigate to Admin Dashboard
2. Click "Owner Requirements" in Quick Actions
3. Or go directly to `/admin/owner-requirements`

#### 2. Create New Requirement
1. Click "Add Requirement"
2. Fill in the form:
   - **Label**: Human-readable name (e.g., "Business Plan")
   - **Field Name**: Unique identifier (e.g., "business_plan")
   - **Input Type**: Choose from available types
   - **Required**: Check if field is mandatory
   - **Placeholder**: Optional placeholder text
   - **Help Text**: Optional guidance for users
   - **Options**: For dropdowns, comma-separated values
   - **Order Index**: Position in the form

#### 3. Supported Input Types
- **text**: Single-line text input
- **textarea**: Multi-line text area
- **number**: Numeric input with step support
- **dropdown**: Select from predefined options
- **file**: File upload
- **date**: Date picker
- **email**: Email input with validation
- **phone**: Phone number input

#### 4. Managing Requirements
- **Edit**: Click edit button on any requirement
- **Delete**: Soft delete (sets `is_active` to false)
- **Reorder**: Use up/down arrows or drag-and-drop
- **Activate/Deactivate**: Toggle `is_active` status

### For Users (Owner Applicants)

#### 1. Access Application Form
1. Navigate to Owner Request Form
2. Form automatically loads with admin-defined fields
3. Fill out all required fields
4. Submit application

#### 2. Form Behavior
- Fields are rendered based on admin configuration
- Required fields are marked with asterisk (*)
- Help text appears below field labels
- Validation occurs on submission
- File uploads are supported for document requirements

## API Reference

### Admin API Endpoints

#### List Requirements
```http
GET /admin/owner-requirements
Authorization: Bearer <admin_token>
```

#### Create Requirement
```http
POST /admin/owner-requirements
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "label": "Business Plan",
  "field_name": "business_plan",
  "input_type": "textarea",
  "is_required": true,
  "placeholder": "Describe your business plan",
  "help_text": "Provide a detailed business plan for your rental business",
  "order_index": 0
}
```

#### Update Requirement
```http
PUT /admin/owner-requirements/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "label": "Updated Business Plan",
  "is_required": false
}
```

#### Delete Requirement
```http
DELETE /admin/owner-requirements/:id
Authorization: Bearer <admin_token>
```

#### Reorder Requirements
```http
POST /admin/owner-requirements/reorder
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "requirements": [
    {"id": 1, "order_index": 0},
    {"id": 2, "order_index": 1},
    {"id": 3, "order_index": 2}
  ]
}
```

### Owner API Endpoints

#### Get Requirements
```http
GET /owner/requirements
```

Response:
```json
{
  "requirements": [
    {
      "id": 1,
      "label": "Business Plan",
      "field_name": "business_plan",
      "input_type": "textarea",
      "is_required": true,
      "placeholder": "Describe your business plan",
      "help_text": "Provide a detailed business plan",
      "options": [],
      "validation_rules": {},
      "order_index": 0,
      "is_active": true
    }
  ]
}
```

## Configuration Examples

### Example 1: Basic Business Information
```json
{
  "label": "Company Name",
  "field_name": "company_name",
  "input_type": "text",
  "is_required": true,
  "placeholder": "Enter your company name",
  "help_text": "Legal business name as registered",
  "order_index": 0
}
```

### Example 2: Dropdown Selection
```json
{
  "label": "Business Type",
  "field_name": "business_type",
  "input_type": "dropdown",
  "is_required": true,
  "options": ["LLC", "Corporation", "Sole Proprietorship", "Partnership"],
  "order_index": 1
}
```

### Example 3: File Upload
```json
{
  "label": "Business License",
  "field_name": "business_license",
  "input_type": "file",
  "is_required": true,
  "help_text": "Upload a copy of your business license",
  "order_index": 2
}
```

### Example 4: Validation Rules
```json
{
  "label": "Investment Amount",
  "field_name": "investment_amount",
  "input_type": "number",
  "is_required": true,
  "validation_rules": {
    "min": 1000,
    "max": 1000000,
    "step": 100
  },
  "order_index": 3
}
```

## Security Considerations

1. **Admin Access**: Only users with admin role can manage requirements
2. **Field Validation**: Server-side validation of all form submissions
3. **SQL Injection**: Uses parameterized queries and ORM
4. **XSS Prevention**: Input sanitization and output encoding
5. **File Upload**: File type and size restrictions (implement as needed)

## Performance Considerations

1. **Database Indexes**: Added on frequently queried fields
2. **Caching**: Requirements can be cached as they change infrequently
3. **Lazy Loading**: Form fields load only when needed
4. **Optimized Queries**: Efficient database queries with proper joins

## Troubleshooting

### Common Issues

#### 1. Requirements Not Loading
- Check if the database migration has been run
- Verify the `owner_requirements` table exists
- Check API endpoint accessibility

#### 2. Form Fields Not Rendering
- Ensure requirements are marked as `is_active: true`
- Check browser console for JavaScript errors
- Verify API response format

#### 3. Validation Errors
- Check field configuration in admin panel
- Verify required fields are properly marked
- Review validation rules format

### Debug Steps

1. **Check Database**: Verify table structure and data
2. **API Testing**: Test endpoints with Postman or similar tool
3. **Frontend Console**: Check browser console for errors
4. **Backend Logs**: Review server logs for errors

## Future Enhancements

1. **Advanced Validation**: Custom validation rules and regex patterns
2. **Conditional Fields**: Show/hide fields based on other field values
3. **Field Dependencies**: Cascading dropdowns and related fields
4. **Template System**: Predefined field templates for common use cases
5. **Import/Export**: Bulk import/export of field configurations
6. **Versioning**: Track changes to field configurations over time
7. **A/B Testing**: Test different field configurations with users

## Support

For technical support or questions about this feature:
1. Check this documentation
2. Review the code comments
3. Check the issue tracker
4. Contact the development team

## Changelog

- **v1.0.0**: Initial implementation of dynamic input fields
- Added OwnerRequirement model and database table
- Implemented admin management interface
- Created dynamic form rendering system
- Added full CRUD operations for requirements



