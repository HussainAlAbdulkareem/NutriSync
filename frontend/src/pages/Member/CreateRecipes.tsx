import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import { apiFetch } from "../api";

type OptionType = {
  label: string;
  value: string;
  ingredientID?: number;
  categoryID?: number;
};

type SelectedIngredientType = {
  ingredientID: number;
  name: string;
  quantity: number;
};

const CreateRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [allIngredients, setAllIngredients] = useState<OptionType[]>([]);
  const [allCategories, setAllCategories] = useState<OptionType[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<SelectedIngredientType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<OptionType[]>([]);
  const [servingSize, setServingSize] = useState(1);
  const [description, setDescription] = useState("");
  const [imageURL, setImage] = useState("");
  const [message, setMessage] = useState("");

  const fetchIngredients = async () => {
    await apiFetch(`/api/member/${id}/ingredient`)
      .then(res => res.json())
      .then(data => {
        const options = data.map((ingredient: any) => ({
          label: ingredient.ingredientName,
          value: ingredient.ingredientName,
          ingredientID: ingredient.ingredientID,
        }));
        setAllIngredients(options);
      })
      .catch(err => console.error("Failed to fetch ingredients", err));
  };

  const fetchCategories = async () => {
    await apiFetch(`/api/member/${id}/category`)
      .then(res => res.json())
      .then(data => {
        const options = data.map((category: any) => ({
          label: category.categoryName,
          value: category.categoryName,
          categoryID: category.categoryID,
        }));
        setAllCategories(options);
      })
      .catch(err => console.error("Failed to fetch categories", err));
  };

  useEffect(() => {
    fetchIngredients();
    fetchCategories();
  }, []);

  const handleIngredientSelect = (selected: readonly OptionType[] | null) => {
    if (!selected) {
      setSelectedIngredients([]);
      return;
    }

    const updated = selected.map((option) => {
      const existing = selectedIngredients.find(i => i.ingredientID === option.ingredientID);
      return {
        ingredientID: option.ingredientID!,
        name: option.value,
        quantity: existing ? existing.quantity : 0,
      };
    });

    setSelectedIngredients(updated);
  };

  const updateQuantity = (ingredientID: number, quantity: number) => {
    setSelectedIngredients((prev) =>
      prev.map((ing) =>
        ing.ingredientID === ingredientID ? { ...ing, quantity } : ing
      )
    );
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    const ingredientValues = selectedIngredients.map(i => ({
      id: i.ingredientID,
      quantity: i.quantity,
    }));

    const categoryValues = selectedCategories.map(c => ({
      id: c.categoryID!,
      name: c.value,
    }));

    try {
      const response = await apiFetch(`/api/member/${id}/add-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          servingSize,
          ingredients: ingredientValues,
          categories: categoryValues,
          imageURL,
        }),
      });

      alert("Recipe created successfully!");
      fetchCategories();
      fetchIngredients();
    } catch (error) {
      alert("Failed to create recipe");
    }
  };

  return (
    <>
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow border-b border-gray-200">
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">NutriSync</div>
        <div className="text-2xl font-extrabold text-blue-700 tracking-tight">Member</div>
      </nav>
      <div className="flex justify-start px-4 mt-4">
        <button
          onClick={() => navigate(`/member/${id}`)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium shadow"
        >
          ← Back to Home
        </button>
      </div>
      <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10 px-4">
        <form onSubmit={handleCreateRecipe} className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Create a Recipe</h2>

          <input
            type="text"
            placeholder="Recipe Name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded"
          />

          <textarea
            placeholder="Recipe Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full mb-4 px-4 py-2 border border-gray-300 rounded"
          />

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">Serving Size: {servingSize}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={servingSize}
              onChange={(e) => setServingSize(parseInt(e.target.value, 10))}
              className="w-full"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">Ingredients</label>
            <Select
              isMulti
              options={allIngredients}
              onChange={handleIngredientSelect}
              getOptionLabel={(e) => e.label}
              getOptionValue={(e) => e.value}
              placeholder="Select Ingredients"
            />
            {selectedIngredients.map((ingredient) => (
              <div key={ingredient.ingredientID} className="flex items-center gap-4 mt-2">
                <span className="text-sm text-gray-700 w-1/3">{ingredient.name}</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Quantity (g)"
                  value={ingredient.quantity}
                  onChange={(e) =>
                    updateQuantity(ingredient.ingredientID, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-2/3 px-2 py-1 border rounded"
                  required
                />
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">Categories</label>
            <Select
              isMulti
              options={allCategories}
              value={selectedCategories}
              onChange={(selected: readonly OptionType[] | null) =>
                setSelectedCategories(selected ? [...selected] : [])
              }
              placeholder="Select Categories"
            />
          </div>

          <input
            type="url"
            placeholder="http://URL-of-image"
            value={imageURL}
            onChange={(e) => setImage(e.target.value)}
            required
            className="w-full mb-6 px-4 py-2 border border-gray-300 rounded"
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Create Recipe
          </button>

          {message && (
            <p
              className={`mt-4 text-center ${
                message.includes("Success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </>
  );
};

export default CreateRecipe;
