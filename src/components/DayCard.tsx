import type {
  Component,
  DayPlan,
  Selection,
} from "../types/recipe";
import MealSlot from "./MealSlot";
import "./DayCard.css";

interface DayCardProps {
  dayPlan: DayPlan;
  dayIndex: number;
  week: DayPlan[];
  components: Component[];
  onToggleMeal: (
    meal: "lunch" | "dinner"
  ) => void;
  onPeopleChange: (
    meal: "lunch" | "dinner",
    people: number
  ) => void;
  onAddSelection: (
    meal: "lunch" | "dinner",
    category:
      | "carbs"
      | "proteins"
      | "vegetables"
      | "elaborations"
      | "extras",
    selection: Selection
  ) => void;
  onRemoveSelection: (
    meal: "lunch" | "dinner",
    category:
      | "carbs"
      | "proteins"
      | "vegetables"
      | "elaborations"
      | "extras",
    selection: Selection
  ) => void;
}

export default function DayCard({
  dayPlan,
  dayIndex,
  week,
  components,
  onToggleMeal,
  onPeopleChange,
  onAddSelection,
  onRemoveSelection,
}: DayCardProps) {
  return (
    <section className="day-card">
      <h2>{dayPlan.day}</h2>

      <MealSlot
        title="Comida"
        dayIndex={dayIndex}
        week={week}
        meal={dayPlan.lunch}
        components={components}
        onToggle={() =>
          onToggleMeal("lunch")
        }
        onPeopleChange={(people) =>
          onPeopleChange("lunch", people)
        }
        onAddSelection={(
          category,
          selection
        ) =>
          onAddSelection(
            "lunch",
            category,
            selection
          )
        }
        onRemoveSelection={(
          category,
          selection
        ) =>
          onRemoveSelection(
            "lunch",
            category,
            selection
          )
        }
      />

      <MealSlot
        title="Cena"
        dayIndex={dayIndex}
        week={week}
        meal={dayPlan.dinner}
        components={components}
        onToggle={() =>
          onToggleMeal("dinner")
        }
        onPeopleChange={(people) =>
          onPeopleChange("dinner", people)
        }
        onAddSelection={(
          category,
          selection
        ) =>
          onAddSelection(
            "dinner",
            category,
            selection
          )
        }
        onRemoveSelection={(
          category,
          selection
        ) =>
          onRemoveSelection(
            "dinner",
            category,
            selection
          )
        }
      />
    </section>
  );
}