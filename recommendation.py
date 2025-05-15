import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import db

# Generate TF-IDF vector for recipes
def generate_recipe_vectors(recipes_df):
    tfidf = TfidfVectorizer(stop_words='english')
    recipe_vectors = tfidf.fit_transform(recipes_df['Title'] + " " + recipes_df['Description'])
    return recipe_vectors, tfidf

# Find similar recipes
def recommend_recipe(user_liked_recipes, recipes_df, recipe_vectors, tfidf):
    user_liked_text = " ".join(user_liked_recipes)
    user_vector = tfidf.transform([user_liked_text])

    similarity_scores = cosine_similarity(user_vector, recipe_vectors).flatten()

    most_similar_idx = similarity_scores.argsort()[-1]
    return recipes_df.iloc[most_similar_idx]

def recommend(userid):
    rows = db.search_recipes()

    all_recipes = pd.DataFrame([
        {'RecipeID': r[0], 'Title': r[1], 'Description': r[2], 'ImageURL': r[3]}
        for r in rows
    ])

    # User liked recipes
    liked = db.get_liked_recipes(userid)
    user_liked_recipes = [r[1] for r in liked]

    # remove recipe that user already liked
    all_recipes = all_recipes[~all_recipes['Title'].isin(user_liked_recipes)]

    # Generate vectors for all recipes
    recipe_vectors, tfidf = generate_recipe_vectors(all_recipes)

    # Get recommendation
    recommended_recipe = list(recommend_recipe(user_liked_recipes, all_recipes, recipe_vectors, tfidf))
    return recommended_recipe

recommend(15)