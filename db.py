import socket

_orig_getaddrinfo = socket.getaddrinfo

def _getaddrinfo_ipv4_only(host, port, family=0, type=0, proto=0, flags=0):
    results = _orig_getaddrinfo(host, port, family, type, proto, flags)
    return [entry for entry in results if entry[0] == socket.AF_INET]

socket.getaddrinfo = _getaddrinfo_ipv4_only


import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import urlparse

load_dotenv()

def get_connection():
    result = urlparse(os.getenv('DATABASE_URL'))
    return psycopg2.connect(
        dbname=result.path[1:],
        user=result.username,
        password=result.password,
        host=result.hostname,
        port=result.port
    )
    

def create_user(name, email, phone_no, password, aid, user_flag):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO "User" (name, email, phoneno, password, aid, userflag)
            VALUES (%s, %s, %s, %s, %s, %s);
        """
        cursor.execute(query, (name, email, phone_no, password, aid, user_flag))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Create User Error: {e}")

def get_user(userid):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT userid, name, email, phoneno, password, aid, userflag
            FROM "User"
            WHERE userid = %s;
        """
        cursor.execute(query, (userid,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Get User Error: {e}")
        return None
    


def delete_user(userid):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = "DELETE FROM \"User\" WHERE userid = %s;"
        cursor.execute(query, (userid,))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Delete User Error: {e}")

def authenticate_user(email, password):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT userid, name, email, phoneno, password, aid, userflag
            FROM "User"
            WHERE email = %s AND password = %s;
        """
        cursor.execute(query, (email, password))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result:
            return result
        else:
            return authenticate_admin(email, password)
    except Exception as e:
        print(f"Authentication Error: {e}")
        return None   

def authenticate_admin(email, password):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT adminid, name
            FROM admin
            WHERE email = %s AND password = %s;
        """
        cursor.execute(query, (email, password))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result:
            return (result[0], result[1],0,0,0,0, 1)
        return None
    except Exception as e:
        print(f"Authentication Error: {e}")
        return None

def update_user_info(userid, name=None, email=None, phone_no=None, password=None):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        updates = []
        params = []

        if name:
            updates.append("name = %s")
            params.append(name)
        if email:
            updates.append("email = %s")
            params.append(email)
        if phone_no:
            updates.append("phoneno = %s")
            params.append(phone_no)
        if password:
            updates.append("password = %s")
            params.append(password)

        if not updates:
            print("No fields provided to update.")
            return False

        query = f"""
            UPDATE "User"
            SET {', '.join(updates)}
            WHERE userid = %s;
        """
        params.append(userid)

        cursor.execute(query, tuple(params))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Update User Info Error: {e}")
        return False

    
def update_admin(admin_id, name, email, password):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            UPDATE Admin
            SET Name = %s, Email = %s, Password = %s
            WHERE AdminID = %s;
        """
        cursor.execute(query, (name, email, password, admin_id))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Update Admin Error: {e}")

def list_all_pending_recipes():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
              recipeid, title, description, timestamp, servingsize, 
              totalcalories, adderid, approved_modid, approved_status, image_url
            FROM Recipe
            WHERE Approved_Status = FALSE;
        """)                       
        rows = cursor.fetchall()   
        cursor.close()
        conn.close()
        return rows               
    except Exception as e:
        print(f"list_all_recipes Error: {e}")
        return []  
 
def get_recipes_by_user(user_id):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT recipeID, title, description, timestamp,
                   servingSize, totalCalories, image_url
            FROM Recipe
            WHERE adderID = %s AND approved_status = TRUE;
            """,
            (user_id,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return rows
    except Exception as e:
        print(f"get_recipes_by_user Error: {e}")
        return []
 
def search_recipe(recipe_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT recipeid, title, description, timestamp, servingsize, 
                   totalcalories, adderid, approved_modid, approved_status, image_url
            FROM Recipe
            WHERE RecipeID = %s;
        """
        cursor.execute(query, (recipe_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Search Recipe Error: {e}")
        return None
    
def add_recipe_ingredient(recipeID, ingredientID, amount):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO ingredients_contains_recipe (recipeid, ingredientid, measurement)
            VALUES (%s, %s, %s);
        """
        cursor.execute(query, (recipeID, ingredientID, amount))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Add Recipe Ingredient Error: {e}")
def get_recipes_of_user(userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT recipeid, title, description, timestamp, servingsize, 
                   totalcalories, adderid, approved_modid, approved_status, image_url
            FROM Recipe
            WHERE adderid = %s;
        """
        cursor.execute(query, (userID,))
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Get Recipes by User Error: {e}")

def get_liked_recipes(userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT R.recipeid, R.title, R.description, R.timestamp, R.servingsize, 
                   R.totalcalories, R.adderid, R.approved_modid, R.approved_status, R.image_url
            FROM Recipe R JOIN "Like" L ON L.recipeid = R.recipeid AND L.userid = %s;
        """
        cursor.execute(query, (userID,))
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Get Liked Recipes Error: {e}")

def add_recipe_category(recipeID, categoryID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO category_belongs_recipe (recipeid, categoryid)
            VALUES (%s, %s);
        """
        cursor.execute(query, (recipeID, categoryID))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Add Recipe Category Error: {e}")

def get_calories_by_ingredient(ingredientID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT calories/unit
            FROM ingredient
            WHERE ingredientid = %s;
        """
        cursor.execute(query, (ingredientID,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Get Calories by Ingredient Error: {e}")
        return None
      
      
def get_all_ingredients():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT ingredientID, name, calories, unit, moderatorID
            FROM Ingredient;
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows  # list of tuples
    except Exception as e:
        print(f"get_all_ingredients Error: {e}")
        return []


def create_ingredient(name , calories, unit, userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
            
        query = """
                INSERT INTO ingredient (name, calories, unit, moderatorid)
                VALUES (%s, %s, %s, %s);
            """
        cursor.execute(query, (name, calories, unit, userID))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Create Ingredient Error: {e}")
        return None

# Approve a recipe by setting Approved_Status = TRUE
def approve_recipe(recipe_id: int, approved_mod_id: int) -> None:
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE Recipe
            SET approved_modid = %s,
                approved_status = TRUE
            WHERE RecipeID = %s;
        """, (approved_mod_id, recipe_id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"approve_recipe Error: {e}")

# Reject (delete) a recipe
def reject_recipe(recipe_id: int) -> None:
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM Recipe WHERE RecipeID = %s;",
            (recipe_id,)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"reject_recipe Error: {e}")
    
def remove_recipe_from_tracker(userID, recipeID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            DELETE FROM recipe_contained_tracking
            WHERE userid = %s AND recipeid = %s
            RETURNING calories;
        """
        cursor.execute(query, (userID, recipeID))
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        if result:
            remove_calories_from_tracker(userID, result[0])
    except Exception as e:
        print(f"Remove Recipe from Tracker Error: {e}")

def remove_calories_from_tracker(userID, calories):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            UPDATE calorie_tracking
            SET totalcalories = totalcalories - %s
            WHERE userid = %s;
        """
        cursor.execute(query, (calories, userID))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Remove Calories from Tracker Error: {e}")

def delete_ingredient(ingredientID, userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        query = """
                DELETE FROM ingredient
                WHERE ingredientid = %s;
            """
        cursor.execute(query, (ingredientID,))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Delete Ingredient Error: {e}")

def get_tracked_recipes_by_id(userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT R.recipeid, R.title, T.calories
            FROM Recipe R JOIN recipe_contained_tracking T ON T.userid = %s 
            AND T.recipeid = R.recipeid;
        """
        cursor.execute(query, (userID,))
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Get Tracked Recipes Error: {e}")
        
# Tracks recipe
def insert_recipe_tracking(user_id, recipe_id, totalcal):
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute(
            '''
            INSERT INTO recipe_contained_tracking (userID, recipeID, calories)
            VALUES (%s, %s, %s);
            ''', (user_id, recipe_id, totalcal)
        )
        conn.commit()
        cur.close(); conn.close()
    except Exception as e:
        print(f"insert_recipe_tracking Error: {e}")
        raise

def view_recipe_ingredient(recipeID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT I.ingredientid, I.name, I.calories, I.unit, I.moderatorid
            FROM ingredients_contains_recipe C
            JOIN ingredient I ON C.ingredientid = I.ingredientid
            WHERE C.recipeid = %s;
        """
        cursor.execute(query, (recipeID,))
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"View Recipe Ingredient Error: {e}")

def get_total_calories(userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT totalcalories
            FROM calorie_tracking
            WHERE userid = %s;
        """
        cursor.execute(query, (userID,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Get Total Calories Error: {e}")

def member_added_recipe_count(userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT COUNT(*)
            FROM Recipe
            WHERE adderid = %s;
        """
        cursor.execute(query, (userID,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Get Recipes by User Error: {e}")


def get_all_categories():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT categoryID, name, moderatorID
            FROM Category;
            """
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows 
    except Exception as e:
        print(f"get_all_categories Error: {e}")
        return []

# Search recipes by optional category and/or ingredient
def search_recipes(category_id: int = None, ingredient_id: int = None):
    try:
        conn = get_connection()
        cur = conn.cursor()
        base = ["SELECT DISTINCT R.recipeID, R.title, R.description, R.image_url",
                "FROM Recipe R"]
        joins = []
        filters = ["R.approved_status = TRUE"]
        params = []

        if ingredient_id:
            joins.append(
                "JOIN ingredients_contains_recipe CIR ON R.recipeID = CIR.recipeID"
            )
            filters.append("CIR.ingredientID = %s")
            params.append(ingredient_id)
        if category_id:
            joins.append(
                "JOIN category_belongs_recipe CBR ON R.recipeID = CBR.recipeID"
            )
            filters.append("CBR.categoryID = %s")
            params.append(category_id)

        sql = " ".join(base + joins + ["WHERE " + " AND ".join(filters)]) + ";"
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return rows
    except Exception as e:
        print(f"search_recipes Error: {e}")
        return []

def get_calories_by_recipe(recipe_id):
    """
    Return the stored total calories for a single recipe from the Recipe table.
    """
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            "SELECT totalcalories/servingsize FROM Recipe WHERE recipeID = %s;",
            (recipe_id,)
        )
        row = cur.fetchone()
        cur.close(); conn.close()
        return float(row[0]) if row and row[0] is not None else 0.0
    except Exception as e:
        print(f"get_calories_by_recipe Error: {e}")
        return 0.0

def create_category(name , userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        
        query = """
                INSERT INTO category (name, moderatorid)
                VALUES (%s, %s);
            """
        cursor.execute(query, (name, userID))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Create Category Error: {e}")
    
def delete_category(categoryID, userID):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        query = """
                DELETE FROM category
                WHERE categoryid = %s;
            """
        cursor.execute(query, (categoryID,))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Delete Category Error: {e}")

def get_all_category():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT categoryid, name, moderatorid
            FROM category;
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"View Category Error: {e}")

def get_categories_for_recipe(recipe_id):
    try:
        conn = get_connection(); cur = conn.cursor()
        cur.execute(
            '''
            SELECT C.categoryID, C.name
            FROM category_belongs_recipe B
            JOIN Category C ON B.categoryID = C.categoryID
            WHERE B.recipeID = %s;
            ''', (recipe_id,)
        )
        rows = cur.fetchall()
        cur.close(); conn.close()
        return rows
    except Exception as e:
        print(f"get_categories_for_recipe Error: {e}")
        return []
    
    
def create_recipe(title, description, serving_size, total_calories, adder_id, image_url):
     try:
         conn = get_connection()
         cursor = conn.cursor()
         query = """
             INSERT INTO Recipe(title, description, timestamp, servingsize, 
                    totalcalories, adderid, approved_modid, approved_status, image_url)
             VALUES (%s, %s, NOW(), %s, %s, %s, null, False, %s)
             RETURNING recipeid;
         """
         cursor.execute(query, (title, description, serving_size, total_calories, adder_id, image_url))
         conn.commit()
         recipe_id = cursor.fetchone()[0]
         cursor.close()
         conn.close()
         return recipe_id
     except Exception as e:
         print(f"Create Recipe Error: {e}")

def update_calories(userID, calories):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT INTO calorie_tracking (userID, totalcalories)
            VALUES (%s, %s)
            ON CONFLICT (userID)
            DO UPDATE SET totalcalories = calorie_tracking.totalcalories + %s;
            ''', (userID, calories, calories)
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Track Recipe Error: {e}")

def get_calories(ingredientName):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT calories FROM ingredient
            WHERE name = %s;
        """
        cursor.execute(query, (ingredientName,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result[0] if result else None
    except Exception as e:
        print(f"Get Calories Error: {e}")

def delete_recipe(recipe_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = "DELETE FROM Recipe WHERE RecipeID = %s;"
        cursor.execute(query, (recipe_id,))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Delete Recipe Error: {e}")

def like_recipe(user_id, recipe_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            INSERT INTO "Like" (UserID, RecipeID, TimeStamp)
            VALUES (%s, %s, NOW());
        """
        cursor.execute(query, (user_id, recipe_id))
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Like Recipe Error: {e}")
        
def delete_like(user_id: int, recipe_id: int):
    """
    Remove a like entry for this user and recipe.
    """
    try:
        conn = get_connection()
        cur  = conn.cursor()
        cur.execute(
            """
            DELETE FROM "Like"
            WHERE userID = %s AND recipeID = %s;
            """,
            (user_id, recipe_id)
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"delete_like Error: {e}")
        raise

def view_all_members():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT userid, name, email FROM "User"
            WHERE userflag = 3;
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"View All Members Error: {e}")

def view_all_moderators():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT userid, name, email FROM "User"
            WHERE userflag = 2; 
        """
        cursor.execute(query)
        result = cursor.fetchall()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"View All Members Error: {e}")

def admin_analytics_past_30_days():
    try:
        counts = { "recipes" : 0, "ingredients" : 0, "categories" : 0, "users" : 0 }
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT COUNT(*) FROM Recipe
            WHERE timestamp >= NOW() - INTERVAL '30 days';
        """
        cursor.execute(query)
        result = cursor.fetchone()
        counts["recipes"] = result[0]

        query = """
            SELECT COUNT(*) FROM Ingredient
        """
        cursor.execute(query)
        result = cursor.fetchone()
        counts["ingredients"] = result[0]

        query = """
            SELECT COUNT(*) FROM Category
        """
        cursor.execute(query)
        result = cursor.fetchone()
        counts["categories"] = result[0]

        query = """
            SELECT COUNT(*) FROM \"User\"
        """
        cursor.execute(query)
        result = cursor.fetchone()
        counts["users"] = result[0]

        cursor.close()
        conn.close()
        return counts
    except Exception as e:
        print(f"New Recipes Past 30 Days Error: {e}")

def get_admin_by_id(admin_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        query = """
            SELECT name, email, password
            FROM Admin
            WHERE adminid = %s;
        """
        cursor.execute(query, (admin_id,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return result
    except Exception as e:
        print(f"Get Admin by ID Error: {e}")

# userflag numbers might be off
def assign_member(user_id, admin_id):
    try:
        if get_admin_by_id(admin_id) is not None:
            conn = get_connection()
            cursor = conn.cursor()
            query = """
                UPDATE "User"
                SET userflag = 2,
                    aid = %s
                WHERE userid = %s;
            """
            cursor.execute(query, (admin_id,user_id))
            conn.commit()
            cursor.close()
            conn.close()
            print("User assigned successfully")
            return True
        else:
            return False
    except Exception as e:
        print(f"Assign Moderator Error: {e}")
        return False

def unassign_moderator(user_id, admin_id):
    try:
        if get_admin_by_id(admin_id) is not None:
            conn = get_connection()
            cursor = conn.cursor()
            query = """
                UPDATE "User"
                SET userflag = 3,
                    aid = %s
                WHERE userid = %s;
            """
            cursor.execute(query, (admin_id,user_id))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        else:
            return False
    except Exception as e:
        print(f"Unassign Moderator Error: {e}")
        return False
    
def ban_user(user_id, admin_id):
    try:
        if get_admin_by_id(admin_id) is not None:
            conn = get_connection()
            cursor = conn.cursor()
            query = """
                DELETE FROM "User"
                WHERE userid = %s;
            """
            cursor.execute(query, (user_id,))
            conn.commit()
            cursor.close()
            conn.close()
            return True
        else:
            print("Acccess Denied")
            return False
    except Exception as e:
        print(f"Ban User Error: {e}")
