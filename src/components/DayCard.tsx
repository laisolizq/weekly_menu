import type { DayPlan, Recipe } from "../types/recipe";
import MealSlot from "./MealSlot";
import "./DayCard.css";

interface DayCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  week: DayPlan[];
  recipes: Recipe[];
  onToggleMeal: (meal: "lunch" | "dinner") => void;
  onPeopleChange: (meal: "lunch" | "dinner", people: number) => void;
  onAddRecipe: (
    recipeId: string,
    targets: Array<{ dayIndex: number; meal: "lunch" | "dinner" }>
  ) => void;
  onRemoveRecipe: (meal: "lunch" | "dinner", recipeId: string) => void;
}

export default function DayCard({
  dayPlan,
  dayIndex,
  week,
  recipes,
  onToggleMeal,
  onPeopleChange,
  onAddRecipe,
  onRemoveRecipe,
}: DayCardProps) {
  return (
    <section className="day-card">
      <h2>{dayPlan.day}</h2>

      <MealSlot
        title="Comida"
        dayIndex={dayIndex}
        week={week}
        meal={dayPlan.lunch}
        recipes={recipes}
        onToggle={() => onToggleMeal("lunch")}
        onPeopleChange={(people) => onPeopleChange("lunch", people)}
        onAddRecipe={onAddRecipe}
        onRemoveRecipe={(recipeId) =>
          onRemoveRecipe("lunch", recipeId)
        }
      />

      <MealSlot
        title="Cena"
        dayIndex={dayIndex}
        week={week}
        meal={dayPlan.dinner}
        recipes={recipes}
        onToggle={() => onToggleMeal("dinner")}
        onPeopleChange={(people) => onPeopleChange("dinner", people)}
        onAddRecipe={onAddRecipe}
        onRemoveRecipe={(recipeId) =>
          onRemoveRecipe("dinner", recipeId)
        }
      />
    </section>
  );
}
