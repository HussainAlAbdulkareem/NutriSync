import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request, render_template, session
import db
from functools import wraps
from flask_cors import CORS
from urllib.parse import urlparse
import logging
import sys
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__, template_folder='templates', static_folder='static')


load_dotenv()

app.secret_key = os.getenv('secret_key', 'dev_key') 

# Decorator to restrict access based on userflag in session
def roles_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            role = session.get('role')
            if role not in allowed_roles:
                return jsonify({'error': 'Forbidden'}), 403
            return f(*args, **kwargs)
        return wrapped
    return decorator

def login_required(f):
    @wraps(f)
    def wrapped(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    return wrapped

# Signup a new member
@app.route('/api/signup', methods=['POST'])
def signup_api():
    data = request.get_json() or {}
    name     = data.get('name')
    email    = data.get('email')    
    password = data.get('password')
    phone_no = data.get('phone_no')
    if not all([name, email, password, phone_no]):
        return jsonify({'error': 'Missing fields'}), 400
    try:
        db.create_user(name, email, phone_no, password, None, 3) # 3 is member, 2 is mod, 1 is admin
        return jsonify({'message': 'User created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# Login and set session
@app.route('/api/login', methods=['POST'])
def login_api():
    data = request.get_json() or {}
    email    = data.get('email')
    password = data.get('password')
    user = db.authenticate_user(email, password)
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    session['user_id'] = user[0]
    session['user_name'] = user[1]
    session['role']    = user[6]
    return jsonify({'message': 'Logged in', 'user': {'UserID': user[0], 'UserName': user[1], 'Role': user[6]}}), 200
    
# Tell the front end who’s logged in
@app.route('/api/user')
@login_required
def get_user_api():
    user_id = session.get('user_id')
    user_name = session.get('user_name')
    role = session.get('role')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    return jsonify({'UserID': user_id, 'UserName': user_name, 'Role': role}), 200

# Search & filter recipes based on category and/or ingredient
@app.route('/api/recipes/search')
@login_required
@roles_required(1,2,3)
def search_recipes_api():
    category_id   = request.args.get('category_id', type=int)
    ingredient_id = request.args.get('ingredient_id', type=int)
    rows = db.search_recipes(category_id, ingredient_id)
    recipes = [
        {
            'RecipeID':    r[0],
            'Title':       r[1],
            'Description': r[2],
            'ImageURL':    r[3]
        }
        for r in rows
    ]
    return jsonify(recipes)


@app.route('/api/recipes/pending')
@login_required
@roles_required(2, 1)
def list_pending_recipes():
    rows = db.list_all_pending_recipes()

    recipes = [{
        'RecipeID':        row[0],
        'Title':           row[1],
        'Description':     row[2],
        'TimeStamp':       row[3].isoformat() if hasattr(row[3], 'isoformat') else row[3],
        'Serving_Size':    row[4],
        'TotalCalories':   row[5],
        'AdderID':         row[6],
        'Approved_ModID':  row[7],
        'Approved_Status': bool(row[8]),
        'ImageURL':        row[9],
    } for row in rows]

    return jsonify(recipes)


@app.route("/api/recipes/<int:recipe_id>")
@login_required
def recipe_page(recipe_id):
    result = db.search_recipe(recipe_id)
    if not result:
        return jsonify({"error": "not found"}), 404
    
    recipe = {
        "RecipeID": result[0],
        "Title": result[1],
        "Description": result[2],
        "TimeStamp": result[3],
        "Serving_Size": result[4],
        "TotalCalories": result[5],
        "AdderID": result[6],
        "Approved_ModID": result[7],
        "Approved_Status": result[8],
        "ImageURL": result[9]
    }
    return jsonify(recipe)
# -------------------------------------------------- RECIPES --------------------------------------------------
@app.route("/api/member/<int:id>/ingredient", methods=["GET"])
def get_ingredients(id):
    ingredients = db.get_all_ingredients()
    if ingredients:
        ingredients_json = []
        for ingredient in ingredients:
            x = {
                "ingredientID": ingredient[0],
                "ingredientName": ingredient[1]
            }
            ingredients_json.append(x)
        return jsonify(ingredients_json)
    else:
        return jsonify([{"message": "No Ingredients Found"}])

@app.route("/api/member/<int:id>/category", methods=["GET"])
def get_categories(id):
    categories = db.get_all_category()
    if categories:
        categories_json = []
        for category in categories:
            x = {
                "categoryID": category[0],
                "categoryName": category[1]
            }
            categories_json.append(x)
        return jsonify(categories_json)
    else:
        return jsonify([{"message": "No Categories Found"}])
    
@app.route("/api/member/<int:id>/add-recipe", methods=["POST"])
@login_required
def add_recipe(id):
    data = request.get_json()
    title = data.get("title")
    descriptions = data.get("description")
    servings = data.get("servingSize")
    ingredients = data.get("ingredients")
    categories = data.get("categories")
    image_url = data.get("imageURL")

    total_calories = 0
    for ingredient in ingredients:
        ingredient_id = ingredient.get("id")
        quantity = ingredient.get("quantity")
        calories = db.get_calories_by_ingredient(ingredient_id)
        total_calories += calories[0] * quantity

    recipe_id = db.create_recipe(title, descriptions,servings,total_calories, id, image_url)
    for ingredient in ingredients:
        db.add_recipe_ingredient(recipe_id, ingredient.get("id"), ingredient.get("quantity"))
    for category in categories:
        db.add_recipe_category(recipe_id, category.get("id"))

# -------------------------------------------------- MEMBER --------------------------------------------------

@app.route("/api/member/<int:id>", methods=["GET"])
@login_required
@roles_required(3)
def member_page(id):
    if session['user_id'] != id:
        return jsonify({'error':'Forbidden'}), 403
    
    analytics = db.member_added_recipe_count(id)[0]
    member = db.get_user(id)
    if member:
        member_name = member[1]
        json_obj = {
            "Name": member_name,
            "recipe": analytics
        }
        return jsonify(json_obj)
    else:
        return None
    
@app.route("/api/member/<int:userid>/tracker/recipe", methods=["GET"])
@login_required
def get_tracked_recipes(userid):
    recipes = db.get_tracked_recipes_by_id(userid)
    if recipes:
        recipes_json = []
        for recipe in recipes:
            x = {
                "id": recipe[0],
                "name": recipe[1],
                "calories" : recipe[2]
            }
            recipes_json.append(x)
        return jsonify(recipes_json)
    else:
        return jsonify([None])

@app.route("/api/member/<int:userid>/tracker/delete/<int:recipeid>", methods=["DELETE"])
@login_required
def delete_tracked_recipe(userid, recipeid):
    if userid != 0:
        db.remove_recipe_from_tracker(userid, recipeid)

@app.route("/api/member/<int:id>/calorie", methods=["GET"])
@login_required
def get_calories(id):
    calories = db.get_total_calories(id)
    if calories:
        return jsonify([int(calories)])
    else:
        return jsonify([0])

@app.route("/api/member/<int:userid>/profile", methods=["GET"])
@login_required
def get_profile(userid):
    user = db.get_user(userid)
    if user:
        user_json = {
            "id": user[0],
            "name": user[1],
            "email": user[2],
            "phoneno": user[3],
            "password": user[4],
            "access": "Moderator" if user[6] == 2 else "Member",
        }
        return jsonify(user_json)
    else:
        return None
    
@app.route("/api/member/<int:userid>/profile/update", methods=["POST"])
@login_required
def update_profile(userid):
    db.update_user_info(userid, request.json["name"], request.json["email"], request.json["phoneno"], request.json["password"])

@app.route("/api/member/<int:userid>/recipe", methods=["GET"])
@login_required
def get_user_recipes(userid):
    recipes = db.get_recipes_of_user(userid)
    if recipes:
        recipes_json = []
        for recipe in recipes:
            x = {
                "id": recipe[0],
                "name": recipe[1],
                "servings" : recipe[4],
                "calories" : recipe[5],
                "approved" : recipe[8],
                "image" : recipe[9]
            }
            recipes_json.append(x)
        return jsonify(recipes_json)
    else:
        return jsonify([{"id": "—", "name": "—", "servings": 0 , "calories": 0, "approved": 0, "image": "—"}])

@app.route("/api/member/<int:userid>/liked", methods=["GET"])
@login_required
def get_liked_recipes(userid):
    recipes = db.get_liked_recipes(userid)
    if recipes:
        recipes_json = []
        for recipe in recipes:
            x = {
                "id": recipe[0],
                "name": recipe[1],
                "servings" : recipe[4],
                "calories" : recipe[5],
                "approved" : recipe[8],
                "image" : recipe[9]
            }
            recipes_json.append(x)
        return jsonify(recipes_json)
    else:
                return jsonify([{"id": "—", "name": "—", "servings": 0 , "calories": 0, "approved": 0, "image": "—"}])

# -------------------------------------------------- ADMIN --------------------------------------------------

@app.route("/api/admin/<int:admin_id>", methods=["GET"])
@login_required
@roles_required(1)
def admin_page(admin_id):
    if session['user_id'] != admin_id:
        return jsonify({'error':'Forbidden'}), 403
    
    analytics = db.admin_analytics_past_30_days()
    admin = db.get_admin_by_id(admin_id)
    if admin:
        admin_name = admin[0]   
        json_obj = {
            "adminName": admin_name,
            "analytics": analytics
        }
        return jsonify(json_obj)
    else:
        return jsonify(None)

@app.route("/api/admin/<int:id>/manage-member/", methods=["GET"])
@login_required
@roles_required(1)
def view_all_members(id):
    members = db.view_all_members()
    if members:
        members_json = []
        for member in members:
            x = {
                "userID": member[0],
                "name": member[1],
                "email": member[2]
            }
            members_json.append(x)
        return jsonify(members_json)
    else:
        return jsonify([None])

@app.route("/api/admin/<int:id>/manage-moderator/", methods=["GET"])
@login_required
@roles_required(1)
def view_all_moderators(id):
    moderators = db.view_all_moderators()
    if moderators:
        moderator_json = []
        for moderator in moderators:
            x = {
                "userID": moderator[0],
                "name": moderator[1],
                "email": moderator[2]
            }
            moderator_json.append(x)
        return jsonify(moderator_json)
    else:
        return jsonify({"message": "No Members Found"})    

@app.route("/api/admin/<int:id>/<string:action>", methods=["POST"])
def manage_user(id, action):
    data = request.get_json()
    user_id = data.get("user_ids")
    if action == "assign":
        for uid in user_id:
            db.assign_member(uid, id)
        return jsonify({"message": "User approved successfully"})
    elif action == "blacklist":
        for uid in user_id:
            db.ban_user(uid, id)
        return jsonify({"message": "User banned successfully"})
    elif action == "unassign":
        for uid in user_id:
            db.unassign_moderator(uid, id)
        return jsonify({"message": "User unbanned successfully"})
    else:
        return jsonify({"message": "Invalid action"}), 400

@app.route('/api/recipe/<int:recipe_id>/approve', methods=['POST'])
@login_required
@roles_required(2,1)
def approve_recipe_api(recipe_id):
    mod_id = request.get_json().get("moderatorID")
    try:
        db.approve_recipe(recipe_id, mod_id)
        return jsonify({ 'message': 'Recipe approved', 'RecipeID': recipe_id }), 200
    except Exception as e:
        app.logger.exception("Error approving recipe")   
        return jsonify({ 'error': str(e) }), 500

# ------------------------------------------------------------------------------------------------------------

@app.route('/api/recipe/<int:recipe_id>/reject', methods=['POST'])
@login_required
@roles_required(2,1)
def reject_recipe_api(recipe_id):
    """
    Reject (delete) a pending recipe.
    """
    try:
        db.reject_recipe(recipe_id)
        return jsonify({ 'message': 'Recipe rejected and deleted', 'RecipeID': recipe_id }), 200
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500
    
# Ingredients list for recipe
@app.route('/api/recipe/<int:recipe_id>/ingredients')
@login_required
def recipe_ingredients_api(recipe_id):
    rows = db.view_recipe_ingredient(recipe_id)
    items = [
        {'ingredientID': r[0], 'name': r[1], 'calories': r[2], 'unit': r[3]}
        for r in rows
    ]
    return jsonify(items)

# Categories list for recipe
@app.route('/api/recipe/<int:recipe_id>/categories')
@login_required
def recipe_categories_api(recipe_id):
    rows = db.get_categories_for_recipe(recipe_id)
    cats = [{'categoryID': c[0], 'name': c[1]} for c in rows]
    return jsonify(cats)

    
# Like a recipe
@app.route('/api/recipe/<int:recipe_id>/like', methods=['POST'])
@login_required
@roles_required(1,2,3)
def like_recipe_api(recipe_id):
    user_id = session.get('user_id')
    try:
        db.like_recipe(user_id, recipe_id)
        return jsonify({'message': 'Recipe liked'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add recipe calories to tracker
@app.route('/api/recipe/<int:recipe_id>/track', methods=['POST'])
@login_required
def track_recipe_api(recipe_id):
    user_id = session.get('user_id')
    serving_size = int(request.json.get('servingSize', 1))
    try:
        calories = db.get_calories_by_recipe(recipe_id)
        db.insert_recipe_tracking(user_id, recipe_id, calories * serving_size)
        db.update_calories(user_id, calories * serving_size)
        return jsonify({'message': 'Calories tracked'}), 200
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500
    
# List all ingredients
@app.route('/api/ingredients')
@login_required
def list_ingredients():
    rows = db.get_all_ingredients()
    ingredients = [
        {
            'ingredientID': row[0],
            'name': row[1],
            'calories': row[2],
            'unit': row[3],
            'moderatorID': row[4]
        } for row in rows
    ]
    return jsonify(ingredients)

# Create a new ingredient
@app.route('/api/ingredient', methods=['POST'])
@login_required
@roles_required(1,2)
def create_ingredient_api():
    data = request.get_json() or {}
    name = data.get('name')
    calories = data.get('calories')
    unit = data.get('unit')
    moderator_id = data.get('moderatorID')
    if not all([name, isinstance(calories, int), moderator_id]):
        return jsonify({'error': 'Missing name, calories, or moderatorID'}), 400
    try:
        db.create_ingredient(name, calories, unit or '', moderator_id)
        return jsonify({'message': 'Ingredient created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
# List all categories
@app.route('/api/categories')
@login_required
@roles_required(1,2,3)
def list_categories():
    rows = db.get_all_categories()
    categories = [
        {
            'categoryID': row[0],
            'name': row[1],
            'moderatorID': row[2]
        } for row in rows
    ]
    return jsonify(categories)

# Create a new category
@app.route('/api/category', methods=['POST'])
@login_required
@roles_required(1,2)
def create_category_api():
    data = request.get_json() or {}
    name = data.get('name')
    moderator_id = data.get('moderatorID')
    if not all([name, isinstance(moderator_id, int)]):
        return jsonify({'error': 'Missing name or moderatorID'}), 400
    try:
        db.create_category(name, moderator_id)
        return jsonify({'message': 'Category created'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chart/approved-recipes')
def chart_approved_recipes():
    conn = db.get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT to_char(timestamp, 'YYYY-MM-DD') as date, COUNT(*) 
        FROM Recipe
        WHERE approved_status = TRUE
        GROUP BY date
        ORDER BY date;
    """)
    results = cur.fetchall()
    cur.close(); conn.close()
    return jsonify([{"date": r[0], "count": r[1]} for r in results])

@app.route('/api/chart/approval-status')
def chart_approval_status():
    conn = db.get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT 
            SUM(CASE WHEN approved_status = TRUE THEN 1 ELSE 0 END),
            SUM(CASE WHEN approved_status = FALSE THEN 1 ELSE 0 END)
        FROM Recipe;
    """)
    result = cur.fetchone()
    cur.close(); conn.close()
    return jsonify([
        {"status": "Approved", "count": result[0]},
        {"status": "Unapproved", "count": result[1]}
    ])
    
# Delete a category
@app.route('/api/category/<int:category_id>', methods=['DELETE'])
@login_required
@roles_required(1,2)
def delete_category_api(category_id):
    try:
        db.delete_category(category_id, 123)
        return jsonify({'message': 'Category deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete an ingredient
@app.route('/api/ingredient/<int:ingredient_id>', methods=['DELETE'])
@login_required
@roles_required(1,2)
def delete_ingredient_api(ingredient_id):
    try:
        db.delete_ingredient(ingredient_id, 123)
        return jsonify({'message': 'Ingredient deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete user profile
@app.route('/api/member/<int:user_id>/profile', methods=['DELETE'])
@login_required
def delete_profile_api(user_id):
    db.delete_user(user_id)
    session.clear()
    return jsonify({'message':'Profile deleted'}),200

# Delete member recipe
@app.route('/api/member/<int:user_id>/recipe/<int:recipe_id>', methods=['DELETE'])
@login_required
def delete_member_recipe_api(user_id, recipe_id):
    db.delete_recipe(recipe_id)
    return jsonify({'message':'Recipe deleted'}),200

# Unlike a recipe
@app.route('/api/recipe/<int:recipe_id>/unlike', methods=['POST'])
@login_required
def unlike_recipe_api(recipe_id):
    user_id = session['user_id']
    db.delete_like(user_id, recipe_id)
    return jsonify({'message':'Like removed'}),200

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

# ✅ Run Flask on port 5001
if __name__ == "__main__":
    app.run(debug=True, port=5001)
