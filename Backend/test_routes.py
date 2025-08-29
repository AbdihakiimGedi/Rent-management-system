#!/usr/bin/env python3
"""
Simple test to check if admin routes are registered
"""

from app import create_app

def test_routes():
    """Test if admin routes are properly registered"""
    app = create_app()
    
    print("🔍 CHECKING ADMIN ROUTES REGISTRATION")
    print("=" * 50)
    
    # Check if admin_bp is registered
    print("📋 Registered blueprints:")
    for blueprint_name, blueprint in app.blueprints.items():
        print(f"  - {blueprint_name}: {blueprint}")
    
    # Check admin routes specifically
    print("\n🔍 Admin routes:")
    admin_routes = []
    for rule in app.url_map.iter_rules():
        if hasattr(rule, 'blueprint') and rule.blueprint == 'admin':
            admin_routes.append(rule)
        elif str(rule).startswith('/admin'):
            admin_routes.append(rule)
    
    if admin_routes:
        for route in admin_routes:
            print(f"  - {route.rule} [{', '.join(route.methods)}]")
    else:
        print("  ❌ No admin routes found!")
        
    # Check all routes that start with /admin
    print("\n🔍 All routes starting with /admin:")
    admin_prefix_routes = []
    for rule in app.url_map.iter_rules():
        if str(rule).startswith('/admin'):
            admin_prefix_routes.append(rule)
    
    if admin_prefix_routes:
        for route in admin_prefix_routes:
            print(f"  - {route.rule} [{', '.join(route.methods)}]")
    else:
        print("  ❌ No routes starting with /admin found!")
    
    print("\n" + "=" * 50)
    print("🔍 ROUTE CHECK COMPLETE")

if __name__ == "__main__":
    test_routes()
