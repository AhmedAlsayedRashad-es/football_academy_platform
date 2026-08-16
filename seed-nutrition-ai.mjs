import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const userId = 1; // Kamal Shawky (admin)

const meals = [
  // Week 1 - 7 days ago
  {
    mealType: 'breakfast',
    daysAgo: 7,
    hour: 7,
    mealDescription: 'Oatmeal with banana and honey, scrambled eggs (3), orange juice',
    recognizedFoods: [
      { name: 'Oatmeal', confidence: 0.95, quantity: '80g', calories: 300, protein: 10, carbs: 54, fat: 6 },
      { name: 'Banana', confidence: 0.97, quantity: '1 medium', calories: 89, protein: 1, carbs: 23, fat: 0 },
      { name: 'Scrambled Eggs', confidence: 0.93, quantity: '3 eggs', calories: 210, protein: 18, carbs: 2, fat: 15 },
    ],
    totalCalories: 599, totalProtein: 29, totalCarbs: 79, totalFat: 21,
    nutritionScore: 82,
    aiAnalysis: 'Excellent pre-training breakfast. High complex carbohydrates from oatmeal provide sustained energy. Eggs deliver quality protein for muscle maintenance. Banana adds quick-release sugars for immediate energy. Well-balanced macronutrient profile for morning training.',
    recommendations: 'Add Greek yogurt for extra protein. Consider timing this 2-3 hours before training.',
  },
  {
    mealType: 'post_workout',
    daysAgo: 7,
    hour: 13,
    mealDescription: 'Grilled chicken breast 200g, brown rice 150g, steamed broccoli, olive oil',
    recognizedFoods: [
      { name: 'Grilled Chicken Breast', confidence: 0.96, quantity: '200g', calories: 330, protein: 62, carbs: 0, fat: 7 },
      { name: 'Brown Rice', confidence: 0.91, quantity: '150g', calories: 166, protein: 4, carbs: 35, fat: 1 },
      { name: 'Broccoli', confidence: 0.88, quantity: '100g', calories: 34, protein: 3, carbs: 7, fat: 0 },
    ],
    totalCalories: 530, totalProtein: 69, totalCarbs: 42, totalFat: 8,
    nutritionScore: 92,
    aiAnalysis: 'Outstanding post-training recovery meal. Very high protein (69g) exceeds the recommended 40-50g for muscle protein synthesis. Brown rice provides complex carbs to replenish glycogen. Broccoli adds anti-inflammatory compounds. This is an elite-level recovery meal.',
    recommendations: 'Perfect timing within 45 minutes post-training. Consider adding sweet potato for more carbs on heavy training days.',
  },
  {
    mealType: 'dinner',
    daysAgo: 7,
    hour: 20,
    mealDescription: 'Salmon fillet 180g, quinoa 120g, mixed salad with avocado',
    recognizedFoods: [
      { name: 'Salmon Fillet', confidence: 0.94, quantity: '180g', calories: 350, protein: 40, carbs: 0, fat: 20 },
      { name: 'Quinoa', confidence: 0.89, quantity: '120g', calories: 222, protein: 8, carbs: 39, fat: 4 },
      { name: 'Avocado', confidence: 0.92, quantity: '50g', calories: 80, protein: 1, carbs: 4, fat: 7 },
    ],
    totalCalories: 652, totalProtein: 49, totalCarbs: 43, totalFat: 31,
    nutritionScore: 89,
    aiAnalysis: 'Excellent evening meal rich in omega-3 fatty acids from salmon, supporting joint health and reducing inflammation. Quinoa is a complete protein source. Avocado provides healthy monounsaturated fats. Ideal for overnight recovery.',
    recommendations: 'Great choice for evening. Omega-3s from salmon will aid recovery overnight. Ensure adequate hydration before sleep.',
  },
  // Day 6
  {
    mealType: 'breakfast',
    daysAgo: 6,
    hour: 7,
    mealDescription: 'Whole wheat toast 2 slices, peanut butter, banana, protein shake',
    recognizedFoods: [
      { name: 'Whole Wheat Toast', confidence: 0.93, quantity: '2 slices', calories: 160, protein: 8, carbs: 30, fat: 2 },
      { name: 'Peanut Butter', confidence: 0.95, quantity: '2 tbsp', calories: 190, protein: 8, carbs: 6, fat: 16 },
      { name: 'Banana', confidence: 0.97, quantity: '1 large', calories: 105, protein: 1, carbs: 27, fat: 0 },
      { name: 'Protein Shake', confidence: 0.90, quantity: '300ml', calories: 150, protein: 25, carbs: 5, fat: 3 },
    ],
    totalCalories: 605, totalProtein: 42, totalCarbs: 68, totalFat: 21,
    nutritionScore: 79,
    aiAnalysis: 'Good pre-training breakfast with balanced macros. Peanut butter adds healthy fats and protein. Protein shake boosts total protein intake significantly. Banana provides quick energy.',
    recommendations: 'Solid breakfast. Consider reducing peanut butter portion on match days to avoid feeling heavy.',
  },
  {
    mealType: 'lunch',
    daysAgo: 6,
    hour: 13,
    mealDescription: 'Tuna pasta salad with vegetables and light dressing',
    recognizedFoods: [
      { name: 'Whole Wheat Pasta', confidence: 0.88, quantity: '100g dry', calories: 350, protein: 13, carbs: 70, fat: 2 },
      { name: 'Tuna in Water', confidence: 0.95, quantity: '150g', calories: 150, protein: 33, carbs: 0, fat: 1 },
      { name: 'Mixed Vegetables', confidence: 0.85, quantity: '100g', calories: 40, protein: 2, carbs: 8, fat: 0 },
    ],
    totalCalories: 540, totalProtein: 48, totalCarbs: 78, totalFat: 3,
    nutritionScore: 85,
    aiAnalysis: 'Very lean, high-protein lunch. Tuna provides excellent lean protein. Whole wheat pasta delivers complex carbohydrates. Very low fat content. Good for maintaining lean body composition.',
    recommendations: 'Add olive oil for healthy fats. Consider adding chickpeas for extra fiber and plant protein.',
  },
  {
    mealType: 'snack',
    daysAgo: 6,
    hour: 16,
    mealDescription: 'Greek yogurt 200g with mixed berries and granola',
    recognizedFoods: [
      { name: 'Greek Yogurt', confidence: 0.96, quantity: '200g', calories: 130, protein: 20, carbs: 9, fat: 0 },
      { name: 'Mixed Berries', confidence: 0.91, quantity: '100g', calories: 57, protein: 1, carbs: 14, fat: 0 },
      { name: 'Granola', confidence: 0.87, quantity: '30g', calories: 130, protein: 3, carbs: 20, fat: 5 },
    ],
    totalCalories: 317, totalProtein: 24, totalCarbs: 43, totalFat: 5,
    nutritionScore: 88,
    aiAnalysis: 'Excellent pre-training snack. Greek yogurt is high in protein and probiotics. Berries provide antioxidants and vitamins. Granola adds crunch and quick energy. Perfect 2 hours before training.',
    recommendations: 'Ideal pre-training snack. The antioxidants from berries help reduce oxidative stress during exercise.',
  },
  {
    mealType: 'dinner',
    daysAgo: 6,
    hour: 20,
    mealDescription: 'Beef steak 200g, sweet potato, green beans, water',
    recognizedFoods: [
      { name: 'Lean Beef Steak', confidence: 0.93, quantity: '200g', calories: 340, protein: 52, carbs: 0, fat: 14 },
      { name: 'Sweet Potato', confidence: 0.95, quantity: '200g', calories: 172, protein: 3, carbs: 40, fat: 0 },
      { name: 'Green Beans', confidence: 0.90, quantity: '100g', calories: 31, protein: 2, carbs: 7, fat: 0 },
    ],
    totalCalories: 543, totalProtein: 57, totalCarbs: 47, totalFat: 14,
    nutritionScore: 87,
    aiAnalysis: 'High-quality dinner with excellent protein from lean beef. Sweet potato provides beta-carotene and complex carbs for glycogen replenishment. Green beans add fiber and micronutrients. Good iron intake from beef supports oxygen transport.',
    recommendations: 'Great recovery dinner. The iron in beef is important for endurance. Ensure you are drinking enough water throughout the day.',
  },
  // Day 5
  {
    mealType: 'breakfast',
    daysAgo: 5,
    hour: 8,
    mealDescription: 'Smoothie bowl: acai, banana, protein powder, almond milk, granola topping',
    recognizedFoods: [
      { name: 'Acai Smoothie Base', confidence: 0.89, quantity: '200ml', calories: 140, protein: 2, carbs: 20, fat: 7 },
      { name: 'Banana', confidence: 0.97, quantity: '1 medium', calories: 89, protein: 1, carbs: 23, fat: 0 },
      { name: 'Protein Powder', confidence: 0.92, quantity: '30g', calories: 120, protein: 24, carbs: 3, fat: 2 },
      { name: 'Granola', confidence: 0.87, quantity: '40g', calories: 173, protein: 4, carbs: 27, fat: 7 },
    ],
    totalCalories: 522, totalProtein: 31, totalCarbs: 73, totalFat: 16,
    nutritionScore: 81,
    aiAnalysis: 'Nutritious and antioxidant-rich breakfast. Acai provides powerful antioxidants. Good protein from powder. Moderate carbohydrates for energy. Visually appealing meal that supports recovery from previous day training.',
    recommendations: 'Add chia seeds for omega-3s. Good rest day breakfast choice.',
  },
  {
    mealType: 'lunch',
    daysAgo: 5,
    hour: 13,
    mealDescription: 'Grilled fish tacos with corn tortillas, cabbage slaw, lime',
    recognizedFoods: [
      { name: 'Grilled White Fish', confidence: 0.91, quantity: '150g', calories: 165, protein: 34, carbs: 0, fat: 3 },
      { name: 'Corn Tortillas', confidence: 0.93, quantity: '3 small', calories: 180, protein: 4, carbs: 36, fat: 3 },
      { name: 'Cabbage Slaw', confidence: 0.88, quantity: '80g', calories: 40, protein: 1, carbs: 9, fat: 0 },
    ],
    totalCalories: 385, totalProtein: 39, totalCarbs: 45, totalFat: 6,
    nutritionScore: 83,
    aiAnalysis: 'Light and nutritious lunch. Lean fish protein with complex carbs from corn tortillas. Cabbage provides vitamin C and fiber. Low fat content makes this ideal for weight management while maintaining muscle mass.',
    recommendations: 'Add avocado for healthy fats. Consider adding black beans for extra protein and fiber.',
  },
  {
    mealType: 'post_workout',
    daysAgo: 5,
    hour: 18,
    mealDescription: 'Chocolate milk 500ml, banana, protein bar',
    recognizedFoods: [
      { name: 'Chocolate Milk', confidence: 0.94, quantity: '500ml', calories: 340, protein: 16, carbs: 56, fat: 8 },
      { name: 'Banana', confidence: 0.97, quantity: '1 large', calories: 105, protein: 1, carbs: 27, fat: 0 },
      { name: 'Protein Bar', confidence: 0.90, quantity: '60g bar', calories: 220, protein: 20, carbs: 25, fat: 7 },
    ],
    totalCalories: 665, totalProtein: 37, totalCarbs: 108, totalFat: 15,
    nutritionScore: 76,
    aiAnalysis: 'Effective post-workout recovery snack. Chocolate milk has an ideal 4:1 carb-to-protein ratio for glycogen replenishment. High carbohydrate content is appropriate immediately post-training. Good for rapid recovery.',
    recommendations: 'Good immediate post-workout choice. Follow with a proper meal within 2 hours for complete recovery.',
  },
  // Day 4
  {
    mealType: 'breakfast',
    daysAgo: 4,
    hour: 7,
    mealDescription: 'Eggs Benedict on whole wheat muffin, fruit salad',
    recognizedFoods: [
      { name: 'Poached Eggs', confidence: 0.95, quantity: '2 eggs', calories: 140, protein: 12, carbs: 1, fat: 10 },
      { name: 'Whole Wheat Muffin', confidence: 0.90, quantity: '1 muffin', calories: 120, protein: 4, carbs: 22, fat: 2 },
      { name: 'Canadian Bacon', confidence: 0.88, quantity: '50g', calories: 70, protein: 10, carbs: 1, fat: 3 },
      { name: 'Fruit Salad', confidence: 0.92, quantity: '150g', calories: 90, protein: 1, carbs: 22, fat: 0 },
    ],
    totalCalories: 420, totalProtein: 27, totalCarbs: 46, totalFat: 15,
    nutritionScore: 78,
    aiAnalysis: 'Moderate breakfast with good protein from eggs. Whole wheat muffin provides complex carbs. Fruit salad adds vitamins and natural sugars. Hollandaise sauce (if present) would add significant calories - assumed light version here.',
    recommendations: 'Add a protein shake to boost protein intake. Good choice for moderate training days.',
  },
  {
    mealType: 'lunch',
    daysAgo: 4,
    hour: 13,
    mealDescription: 'Lentil soup with whole wheat bread, side salad',
    recognizedFoods: [
      { name: 'Lentil Soup', confidence: 0.93, quantity: '400ml', calories: 230, protein: 18, carbs: 40, fat: 2 },
      { name: 'Whole Wheat Bread', confidence: 0.91, quantity: '2 slices', calories: 160, protein: 8, carbs: 30, fat: 2 },
      { name: 'Mixed Salad', confidence: 0.87, quantity: '100g', calories: 25, protein: 2, carbs: 5, fat: 0 },
    ],
    totalCalories: 415, totalProtein: 28, totalCarbs: 75, totalFat: 4,
    nutritionScore: 84,
    aiAnalysis: 'Excellent plant-based lunch. Lentils are rich in protein, fiber, and iron. Complex carbohydrates provide sustained energy. Very low fat content. High fiber supports digestive health. Good choice for recovery days.',
    recommendations: 'Add olive oil to salad for healthy fats. Lentils are excellent for plant-based iron intake.',
  },
  {
    mealType: 'dinner',
    daysAgo: 4,
    hour: 19,
    mealDescription: 'Grilled lamb chops 200g, couscous, roasted vegetables',
    recognizedFoods: [
      { name: 'Lamb Chops', confidence: 0.91, quantity: '200g', calories: 380, protein: 44, carbs: 0, fat: 22 },
      { name: 'Couscous', confidence: 0.89, quantity: '100g', calories: 176, protein: 6, carbs: 36, fat: 0 },
      { name: 'Roasted Vegetables', confidence: 0.86, quantity: '150g', calories: 80, protein: 3, carbs: 16, fat: 2 },
    ],
    totalCalories: 636, totalProtein: 53, totalCarbs: 52, totalFat: 24,
    nutritionScore: 80,
    aiAnalysis: 'High-protein dinner with good macro balance. Lamb provides complete protein and zinc, important for immune function and testosterone. Couscous is a good carbohydrate source. Roasted vegetables add micronutrients.',
    recommendations: 'Good pre-match dinner if eaten 3+ hours before. The zinc in lamb supports recovery and immune health.',
  },
  // Day 3
  {
    mealType: 'pre_workout',
    daysAgo: 3,
    hour: 9,
    mealDescription: 'Energy bar, banana, black coffee',
    recognizedFoods: [
      { name: 'Energy Bar', confidence: 0.90, quantity: '65g', calories: 250, protein: 8, carbs: 42, fat: 7 },
      { name: 'Banana', confidence: 0.97, quantity: '1 medium', calories: 89, protein: 1, carbs: 23, fat: 0 },
    ],
    totalCalories: 339, totalProtein: 9, totalCarbs: 65, totalFat: 7,
    nutritionScore: 72,
    aiAnalysis: 'Adequate pre-training snack focused on carbohydrates for energy. Good quick-energy sources. Coffee provides caffeine for performance enhancement. Low protein content - acceptable for pre-workout.',
    recommendations: 'Add a boiled egg or Greek yogurt for protein. Caffeine from coffee can improve performance by 3-7%.',
  },
  {
    mealType: 'post_workout',
    daysAgo: 3,
    hour: 12,
    mealDescription: 'Whey protein shake 40g, oats 80g, almond butter, blueberries',
    recognizedFoods: [
      { name: 'Whey Protein', confidence: 0.95, quantity: '40g scoop', calories: 160, protein: 32, carbs: 4, fat: 3 },
      { name: 'Rolled Oats', confidence: 0.93, quantity: '80g', calories: 300, protein: 10, carbs: 54, fat: 6 },
      { name: 'Almond Butter', confidence: 0.91, quantity: '1 tbsp', calories: 98, protein: 3, carbs: 3, fat: 9 },
      { name: 'Blueberries', confidence: 0.95, quantity: '80g', calories: 46, protein: 1, carbs: 11, fat: 0 },
    ],
    totalCalories: 604, totalProtein: 46, totalCarbs: 72, totalFat: 18,
    nutritionScore: 91,
    aiAnalysis: 'Excellent post-workout recovery meal. Whey protein provides fast-absorbing amino acids for muscle repair. Oats replenish glycogen stores. Blueberries are rich in antioxidants that reduce exercise-induced oxidative stress. Almond butter adds healthy fats.',
    recommendations: 'Near-perfect post-workout meal. Consume within 30 minutes of training for maximum muscle protein synthesis.',
  },
  {
    mealType: 'dinner',
    daysAgo: 3,
    hour: 20,
    mealDescription: 'Spaghetti bolognese with lean beef, whole wheat pasta, tomato sauce',
    recognizedFoods: [
      { name: 'Whole Wheat Spaghetti', confidence: 0.90, quantity: '120g dry', calories: 420, protein: 16, carbs: 84, fat: 2 },
      { name: 'Lean Ground Beef', confidence: 0.93, quantity: '150g', calories: 255, protein: 36, carbs: 0, fat: 12 },
      { name: 'Tomato Sauce', confidence: 0.88, quantity: '150g', calories: 60, protein: 3, carbs: 12, fat: 1 },
    ],
    totalCalories: 735, totalProtein: 55, totalCarbs: 96, totalFat: 15,
    nutritionScore: 83,
    aiAnalysis: 'Classic pre-match carbohydrate loading meal. High carbohydrate content from whole wheat pasta is ideal the night before a match. Good protein from lean beef. Tomato sauce provides lycopene, a powerful antioxidant.',
    recommendations: 'Excellent pre-match dinner (night before). The high carb content will maximize glycogen stores for match day.',
  },
  // Day 2
  {
    mealType: 'breakfast',
    daysAgo: 2,
    hour: 7,
    mealDescription: 'Match day breakfast: white rice, grilled chicken, boiled eggs, orange juice',
    recognizedFoods: [
      { name: 'White Rice', confidence: 0.94, quantity: '200g cooked', calories: 260, protein: 5, carbs: 57, fat: 0 },
      { name: 'Grilled Chicken', confidence: 0.95, quantity: '150g', calories: 248, protein: 46, carbs: 0, fat: 5 },
      { name: 'Boiled Eggs', confidence: 0.96, quantity: '2 eggs', calories: 140, protein: 12, carbs: 1, fat: 10 },
      { name: 'Orange Juice', confidence: 0.92, quantity: '250ml', calories: 112, protein: 2, carbs: 26, fat: 0 },
    ],
    totalCalories: 760, totalProtein: 65, totalCarbs: 84, totalFat: 15,
    nutritionScore: 90,
    aiAnalysis: 'Excellent match day breakfast. High carbohydrate content ensures full glycogen stores. Significant protein intake supports muscle function. Orange juice provides vitamin C and quick sugars. White rice is easily digestible, reducing GI discomfort during the match.',
    recommendations: 'Consume 3-4 hours before match. Avoid high-fiber foods on match day. Stay well hydrated throughout the day.',
  },
  {
    mealType: 'snack',
    daysAgo: 2,
    hour: 11,
    mealDescription: 'Pre-match snack: banana, dates 5 pieces, isotonic sports drink',
    recognizedFoods: [
      { name: 'Banana', confidence: 0.97, quantity: '1 large', calories: 105, protein: 1, carbs: 27, fat: 0 },
      { name: 'Dates', confidence: 0.93, quantity: '5 pieces', calories: 140, protein: 1, carbs: 37, fat: 0 },
      { name: 'Sports Drink', confidence: 0.89, quantity: '500ml', calories: 130, protein: 0, carbs: 32, fat: 0 },
    ],
    totalCalories: 375, totalProtein: 2, totalCarbs: 96, totalFat: 0,
    nutritionScore: 77,
    aiAnalysis: 'High-carbohydrate pre-match snack. Dates are an excellent source of quick energy and are used by many professional athletes. Banana provides potassium to prevent cramps. Sports drink ensures hydration and electrolyte balance.',
    recommendations: 'Consume 60-90 minutes before kick-off. The high carb content is intentional for match day energy.',
  },
  {
    mealType: 'post_workout',
    daysAgo: 2,
    hour: 16,
    mealDescription: 'Post-match recovery: chocolate milk, chicken sandwich, banana',
    recognizedFoods: [
      { name: 'Chocolate Milk', confidence: 0.94, quantity: '500ml', calories: 340, protein: 16, carbs: 56, fat: 8 },
      { name: 'Chicken Sandwich', confidence: 0.90, quantity: '1 sandwich', calories: 380, protein: 28, carbs: 42, fat: 10 },
      { name: 'Banana', confidence: 0.97, quantity: '1 medium', calories: 89, protein: 1, carbs: 23, fat: 0 },
    ],
    totalCalories: 809, totalProtein: 45, totalCarbs: 121, totalFat: 18,
    nutritionScore: 79,
    aiAnalysis: 'Good post-match recovery meal. Higher calorie intake is appropriate after a full match. Chocolate milk provides the ideal carb-to-protein ratio. Chicken sandwich adds substantial protein and carbohydrates for recovery.',
    recommendations: 'Good post-match nutrition. Consider adding a recovery shake with electrolytes if the match was in hot conditions.',
  },
  // Day 1 (yesterday)
  {
    mealType: 'breakfast',
    daysAgo: 1,
    hour: 8,
    mealDescription: 'Recovery day: avocado toast, poached eggs, smoked salmon',
    recognizedFoods: [
      { name: 'Whole Grain Toast', confidence: 0.93, quantity: '2 slices', calories: 160, protein: 8, carbs: 30, fat: 2 },
      { name: 'Avocado', confidence: 0.95, quantity: '1/2 avocado', calories: 120, protein: 2, carbs: 6, fat: 11 },
      { name: 'Poached Eggs', confidence: 0.95, quantity: '2 eggs', calories: 140, protein: 12, carbs: 1, fat: 10 },
      { name: 'Smoked Salmon', confidence: 0.93, quantity: '80g', calories: 130, protein: 20, carbs: 0, fat: 6 },
    ],
    totalCalories: 550, totalProtein: 42, totalCarbs: 37, totalFat: 29,
    nutritionScore: 86,
    aiAnalysis: 'Excellent recovery day breakfast. Smoked salmon provides omega-3 fatty acids crucial for reducing inflammation after match day. Avocado adds healthy monounsaturated fats. High protein content supports muscle repair. Lower carbohydrates appropriate for rest day.',
    recommendations: 'Perfect recovery day breakfast. The omega-3s from salmon will help reduce post-match muscle soreness.',
  },
  {
    mealType: 'lunch',
    daysAgo: 1,
    hour: 13,
    mealDescription: 'Chicken Caesar salad with croutons, parmesan, Caesar dressing',
    recognizedFoods: [
      { name: 'Grilled Chicken', confidence: 0.95, quantity: '180g', calories: 297, protein: 55, carbs: 0, fat: 6 },
      { name: 'Romaine Lettuce', confidence: 0.92, quantity: '100g', calories: 17, protein: 1, carbs: 3, fat: 0 },
      { name: 'Croutons', confidence: 0.88, quantity: '30g', calories: 120, protein: 3, carbs: 22, fat: 3 },
      { name: 'Caesar Dressing', confidence: 0.85, quantity: '30ml', calories: 120, protein: 1, carbs: 2, fat: 12 },
    ],
    totalCalories: 554, totalProtein: 60, totalCarbs: 27, totalFat: 21,
    nutritionScore: 80,
    aiAnalysis: 'High-protein lunch ideal for recovery day. Very high protein content (60g) supports muscle repair. Lower carbohydrates appropriate for rest day. Caesar dressing adds flavor but also significant fat - consider lighter dressing option.',
    recommendations: 'Excellent protein content. Consider olive oil and lemon instead of Caesar dressing to reduce saturated fat.',
  },
  {
    mealType: 'dinner',
    daysAgo: 1,
    hour: 19,
    mealDescription: 'Baked cod 200g, roasted sweet potato, asparagus, lemon butter sauce',
    recognizedFoods: [
      { name: 'Baked Cod', confidence: 0.93, quantity: '200g', calories: 180, protein: 40, carbs: 0, fat: 2 },
      { name: 'Sweet Potato', confidence: 0.95, quantity: '200g', calories: 172, protein: 3, carbs: 40, fat: 0 },
      { name: 'Asparagus', confidence: 0.91, quantity: '100g', calories: 20, protein: 2, carbs: 4, fat: 0 },
      { name: 'Lemon Butter Sauce', confidence: 0.82, quantity: '20g', calories: 140, protein: 0, carbs: 0, fat: 16 },
    ],
    totalCalories: 512, totalProtein: 45, totalCarbs: 44, totalFat: 18,
    nutritionScore: 85,
    aiAnalysis: 'Well-balanced recovery dinner. Cod is an excellent lean protein source. Sweet potato provides complex carbs and beta-carotene. Asparagus is rich in folate and vitamins K and C. Lemon butter adds flavor and healthy fats.',
    recommendations: 'Great recovery dinner. Asparagus contains asparagine which supports kidney function and detoxification.',
  },
  // Today
  {
    mealType: 'breakfast',
    daysAgo: 0,
    hour: 7,
    mealDescription: 'Overnight oats with chia seeds, almond milk, berries, honey',
    recognizedFoods: [
      { name: 'Rolled Oats', confidence: 0.94, quantity: '80g', calories: 300, protein: 10, carbs: 54, fat: 6 },
      { name: 'Chia Seeds', confidence: 0.92, quantity: '15g', calories: 73, protein: 2, carbs: 6, fat: 5 },
      { name: 'Almond Milk', confidence: 0.90, quantity: '200ml', calories: 26, protein: 1, carbs: 1, fat: 2 },
      { name: 'Mixed Berries', confidence: 0.93, quantity: '100g', calories: 57, protein: 1, carbs: 14, fat: 0 },
    ],
    totalCalories: 456, totalProtein: 14, totalCarbs: 75, totalFat: 13,
    nutritionScore: 87,
    aiAnalysis: 'Excellent breakfast choice. Overnight oats are highly digestible and provide sustained energy. Chia seeds add omega-3 fatty acids, fiber, and complete protein. Berries provide powerful antioxidants. Great for a training day morning.',
    recommendations: 'Add a protein source (Greek yogurt or protein powder) to boost protein content to 25-30g for optimal muscle maintenance.',
  },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log('Seeding nutrition AI meal logs...');
  
  let inserted = 0;
  for (const meal of meals) {
    const mealDate = new Date();
    mealDate.setDate(mealDate.getDate() - meal.daysAgo);
    mealDate.setHours(meal.hour, 0, 0, 0);
    
    const dateStr = mealDate.toISOString().split('T')[0];
    
    await conn.execute(
      `INSERT INTO meal_logs (userId, mealType, mealDate, mealTime, recognizedFoods, totalCalories, totalProtein, totalCarbs, totalFat, aiAnalysis, nutritionScore, recommendations, alignsWithPlan, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        meal.mealType,
        dateStr,
        mealDate,
        JSON.stringify(meal.recognizedFoods),
        meal.totalCalories,
        meal.totalProtein,
        meal.totalCarbs,
        meal.totalFat,
        meal.aiAnalysis,
        meal.nutritionScore,
        meal.recommendations,
        1,
        mealDate,
        mealDate,
      ]
    );
    inserted++;
  }
  
  console.log(`✅ Inserted ${inserted} meal logs`);
  
  // Check total
  const [count] = await conn.execute('SELECT COUNT(*) as cnt FROM meal_logs WHERE userId = ?', [userId]);
  console.log(`Total meal logs for user ${userId}:`, count[0].cnt);
  
  await conn.end();
}

main().catch(console.error);
