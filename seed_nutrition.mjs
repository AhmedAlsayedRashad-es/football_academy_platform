/**
 * Seed nutrition plan templates into the database.
 * Run: node seed_nutrition.mjs
 * Templates are stored as meal_plans with a special template playerId=0 (or first available player).
 * The getTemplates procedure groups by title, so we just need one player_id.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse the DATABASE_URL (mysql://user:pass@host:port/db)
const url = new URL(DB_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

// Get first player id to use as template owner
const [players] = await conn.execute('SELECT id FROM players LIMIT 1');
if (!players || players.length === 0) {
  console.error('No players found in DB. Please create a player first.');
  await conn.end();
  process.exit(1);
}
const templatePlayerId = players[0].id;
const today = new Date().toISOString().split('T')[0];

const TEMPLATES = [
  {
    title: "Pre-Season High Energy",
    meals: [
      {
        mealType: "breakfast",
        foods: JSON.stringify(["Oatmeal with banana and honey (300g)", "Boiled eggs x3", "Whole milk (300ml)", "Orange juice (200ml)"]),
        calories: 720, protein: 38, carbs: 95, fats: 18, hydrationMl: 500,
        notes: "High carb breakfast to fuel morning double sessions"
      },
      {
        mealType: "pre_training",
        foods: JSON.stringify(["Banana x2", "Dates x5", "Energy bar (60g)", "Water (500ml)"]),
        calories: 380, protein: 8, carbs: 82, fats: 4, hydrationMl: 500,
        notes: "45 min before training. Easy-to-digest carbs only."
      },
      {
        mealType: "post_training",
        foods: JSON.stringify(["Whey protein shake (40g protein)", "Chocolate milk (400ml)", "Banana x1", "Rice cakes x4"]),
        calories: 520, protein: 52, carbs: 68, fats: 6, hydrationMl: 600,
        notes: "Within 30 min of training. 3:1 carb-to-protein ratio."
      },
      {
        mealType: "lunch",
        foods: JSON.stringify(["Grilled chicken breast (200g)", "White rice (300g cooked)", "Mixed vegetables (150g)", "Olive oil (1 tbsp)", "Salad with lemon dressing"]),
        calories: 680, protein: 55, carbs: 78, fats: 14, hydrationMl: 400,
        notes: "Main recovery meal. Lean protein + complex carbs."
      },
      {
        mealType: "dinner",
        foods: JSON.stringify(["Salmon fillet (180g)", "Sweet potato (250g)", "Steamed broccoli (200g)", "Avocado (half)", "Whole grain bread x2 slices"]),
        calories: 620, protein: 45, carbs: 65, fats: 22, hydrationMl: 400,
        notes: "Anti-inflammatory dinner. Omega-3 rich."
      },
      {
        mealType: "snack",
        foods: JSON.stringify(["Greek yogurt (200g)", "Mixed nuts (30g)", "Berries (100g)", "Casein protein before bed (optional)"]),
        calories: 320, protein: 22, carbs: 28, fats: 14, hydrationMl: 200,
        notes: "Evening snack. Slow-release protein for overnight recovery."
      }
    ]
  },
  {
    title: "Match Day Protocol",
    meals: [
      {
        mealType: "breakfast",
        foods: JSON.stringify(["Pasta with tomato sauce (400g cooked)", "Scrambled eggs x3", "Toast x2 slices", "Banana x1", "Orange juice (300ml)"]),
        calories: 850, protein: 35, carbs: 140, fats: 12, hydrationMl: 500,
        notes: "3-4 hours before match. High carb loading meal."
      },
      {
        mealType: "pre_training",
        foods: JSON.stringify(["Energy gel x2", "Banana x1", "Sports drink (500ml)", "White bread with jam x2 slices"]),
        calories: 420, protein: 6, carbs: 98, fats: 2, hydrationMl: 700,
        notes: "1-2 hours before kickoff. Easily digestible carbs only. NO fat or fiber."
      },
      {
        mealType: "snack",
        foods: JSON.stringify(["Orange slices (half-time)", "Sports drink (250ml)", "Energy chews x4"]),
        calories: 180, protein: 2, carbs: 44, fats: 0, hydrationMl: 350,
        notes: "Half-time fuel. Quick carbs to maintain energy for 2nd half."
      },
      {
        mealType: "post_training",
        foods: JSON.stringify(["Chocolate milk (500ml)", "Banana x2", "Protein bar (30g protein)", "Electrolyte drink (500ml)"]),
        calories: 680, protein: 48, carbs: 88, fats: 10, hydrationMl: 1000,
        notes: "Immediately after final whistle. Rehydration + glycogen replenishment."
      },
      {
        mealType: "dinner",
        foods: JSON.stringify(["Grilled chicken or beef (250g)", "Pasta or rice (350g cooked)", "Roasted vegetables (200g)", "Salad with olive oil", "Fruit salad for dessert"]),
        calories: 780, protein: 58, carbs: 90, fats: 18, hydrationMl: 500,
        notes: "Post-match recovery dinner. 2-3 hours after match."
      }
    ]
  },
  {
    title: "Recovery & Rest Day",
    meals: [
      {
        mealType: "breakfast",
        foods: JSON.stringify(["Whole grain toast x2", "Avocado (half)", "Poached eggs x2", "Spinach (50g)", "Green tea or coffee"]),
        calories: 480, protein: 24, carbs: 45, fats: 22, hydrationMl: 400,
        notes: "Lighter breakfast on rest days. Anti-inflammatory focus."
      },
      {
        mealType: "lunch",
        foods: JSON.stringify(["Tuna or salmon salad (150g fish)", "Quinoa (200g cooked)", "Cucumber, tomato, olives", "Lemon-olive oil dressing", "Whole grain bread x1 slice"]),
        calories: 520, protein: 42, carbs: 48, fats: 16, hydrationMl: 400,
        notes: "Anti-inflammatory omega-3 focus. Moderate carbs on rest day."
      },
      {
        mealType: "snack",
        foods: JSON.stringify(["Apple or pear", "Almond butter (2 tbsp)", "Walnuts (20g)", "Water (500ml)"]),
        calories: 280, protein: 8, carbs: 30, fats: 16, hydrationMl: 500,
        notes: "Healthy fats and antioxidants for tissue repair."
      },
      {
        mealType: "dinner",
        foods: JSON.stringify(["Beef or lamb (200g)", "Roasted sweet potato (200g)", "Mixed greens salad", "Turmeric rice (150g cooked)", "Yogurt with honey"]),
        calories: 680, protein: 50, carbs: 65, fats: 20, hydrationMl: 400,
        notes: "Anti-inflammatory spices (turmeric, ginger). Collagen-supporting foods."
      }
    ]
  },
  {
    title: "Ramadan Fasting Plan",
    meals: [
      {
        mealType: "breakfast",
        foods: JSON.stringify(["Dates x7 (Iftar opener)", "Water (500ml)", "Laban/Ayran (300ml)", "Vegetable soup (300ml)", "Pause 20 min before main meal"]),
        calories: 280, protein: 8, carbs: 60, fats: 4, hydrationMl: 800,
        notes: "IFTAR - Break fast gently. Dates + water first. Wait before main meal."
      },
      {
        mealType: "dinner",
        foods: JSON.stringify(["Grilled chicken (200g)", "Brown rice (250g cooked)", "Lentil soup (300ml)", "Mixed salad with olive oil", "Whole grain bread x2"]),
        calories: 820, protein: 55, carbs: 95, fats: 18, hydrationMl: 600,
        notes: "IFTAR main meal. Balanced macros. Avoid fried/heavy foods."
      },
      {
        mealType: "snack",
        foods: JSON.stringify(["Fruit salad (300g)", "Nuts mix (40g)", "Protein shake (optional 30g)", "Water (500ml)"]),
        calories: 420, protein: 18, carbs: 52, fats: 18, hydrationMl: 500,
        notes: "Between Iftar and Suhoor. Light snack for sustained energy."
      },
      {
        mealType: "pre_training",
        foods: JSON.stringify(["Oatmeal (100g dry)", "Banana x2", "Boiled eggs x3", "Whole milk (300ml)", "Dates x5", "Water (750ml)"]),
        calories: 780, protein: 38, carbs: 110, fats: 16, hydrationMl: 750,
        notes: "SUHOOR - Last meal before Fajr. High carb + protein to sustain through day. Eat slowly."
      }
    ]
  },
  {
    title: "High-Intensity Training Week",
    meals: [
      {
        mealType: "breakfast",
        foods: JSON.stringify(["Overnight oats (150g oats)", "Protein powder (30g)", "Banana x1", "Blueberries (100g)", "Almond milk (300ml)", "Chia seeds (1 tbsp)"]),
        calories: 680, protein: 45, carbs: 88, fats: 14, hydrationMl: 500,
        notes: "Sustained energy release. High antioxidants for inflammation control."
      },
      {
        mealType: "pre_training",
        foods: JSON.stringify(["White rice (200g cooked)", "Chicken breast (100g)", "Banana x1", "Electrolyte drink (500ml)"]),
        calories: 480, protein: 32, carbs: 78, fats: 4, hydrationMl: 700,
        notes: "90 min before session. Easily digestible. No heavy fats or fiber."
      },
      {
        mealType: "post_training",
        foods: JSON.stringify(["Whey protein shake (50g protein)", "Gatorade or sports drink (500ml)", "White bread x4 slices with jam", "Banana x2"]),
        calories: 720, protein: 58, carbs: 95, fats: 6, hydrationMl: 800,
        notes: "CRITICAL: Within 20 min of training. Maximize glycogen resynthesis."
      },
      {
        mealType: "lunch",
        foods: JSON.stringify(["Beef or chicken (250g)", "Pasta (350g cooked)", "Tomato-based sauce", "Parmesan (30g)", "Green salad", "Olive oil dressing"]),
        calories: 850, protein: 62, carbs: 95, fats: 22, hydrationMl: 400,
        notes: "High calorie main meal. Supports muscle protein synthesis."
      },
      {
        mealType: "snack",
        foods: JSON.stringify(["Cottage cheese (200g)", "Pineapple chunks (150g)", "Granola (50g)", "Water (500ml)"]),
        calories: 380, protein: 28, carbs: 48, fats: 8, hydrationMl: 500,
        notes: "Afternoon snack. Casein protein for sustained amino acid delivery."
      },
      {
        mealType: "dinner",
        foods: JSON.stringify(["Salmon (200g)", "Quinoa (200g cooked)", "Asparagus (150g)", "Beetroot salad (100g)", "Kefir (200ml)"]),
        calories: 620, protein: 48, carbs: 58, fats: 20, hydrationMl: 400,
        notes: "Anti-inflammatory omega-3. Nitrates from beetroot improve oxygen efficiency."
      }
    ]
  }
];

let totalInserted = 0;

for (const template of TEMPLATES) {
  console.log(`\nSeeding template: "${template.title}"`);
  for (const meal of template.meals) {
    await conn.execute(
      `INSERT INTO meal_plans (playerId, title, planDate, mealType, foods, calories, protein, carbs, fats, hydrationMl, notes, isConsumed, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        templatePlayerId,
        template.title,
        today,
        meal.mealType,
        meal.foods,
        meal.calories,
        meal.protein,
        meal.carbs,
        meal.fats,
        meal.hydrationMl,
        meal.notes
      ]
    );
    console.log(`  ✓ ${meal.mealType}: ${meal.calories} kcal`);
    totalInserted++;
  }
}

console.log(`\n✅ Done! Inserted ${totalInserted} meal plan entries across ${TEMPLATES.length} templates.`);
console.log(`Templates: ${TEMPLATES.map(t => `"${t.title}"`).join(', ')}`);
await conn.end();
