import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import random

class TaskPredictor:
    """
    Hybrid prediction model:
    - Uses trained LinearRegression on synthetic data
    - Combined with domain heuristics for accuracy
    """

    # Base execution times in seconds per task type (empirical baselines)
    BASE_TIMES = {
        "CPU":     {"base": 15.0, "variance": 5.0,  "priority_sensitivity": 0.7},
        "IO":      {"base": 8.0,  "variance": 3.0,  "priority_sensitivity": 0.4},
        "MEMORY":  {"base": 12.0, "variance": 4.0,  "priority_sensitivity": 0.6},
        "NETWORK": {"base": 6.0,  "variance": 2.5,  "priority_sensitivity": 0.3},
        "GPU":     {"base": 25.0, "variance": 8.0,  "priority_sensitivity": 0.9},
    }

    COMPLEXITY_LABELS = {
        (0.1, 2.0):  "Trivial",
        (2.0, 4.0):  "Simple",
        (4.0, 6.0):  "Moderate",
        (6.0, 8.0):  "Complex",
        (8.0, 10.1): "Critical",
    }

    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self._train_on_synthetic_data()

    def _encode_task_type(self, task_type: str) -> int:
        encoding = {"CPU": 0, "IO": 1, "MEMORY": 2, "NETWORK": 3, "GPU": 4}
        return encoding.get(task_type, 0)

    def _train_on_synthetic_data(self):
        """Generate synthetic training data based on known heuristics."""
        random.seed(42)
        np.random.seed(42)

        X, y = [], []
        for _ in range(500):
            task_type = random.choice(list(self.BASE_TIMES.keys()))
            priority = random.randint(1, 5)
            complexity = round(random.uniform(0.1, 10.0), 2)

            config = self.BASE_TIMES[task_type]
            # Ground truth formula (what the model learns)
            base = config["base"]
            variance = np.random.normal(0, config["variance"] * 0.2)
            priority_factor = 1.0 - (priority - 1) * config["priority_sensitivity"] * 0.08
            time = max(1.0, (base * complexity * 0.3 * priority_factor) + variance)

            X.append([self._encode_task_type(task_type), priority, complexity])
            y.append(time)

        X = np.array(X)
        y = np.array(y)
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)

    def _get_complexity_label(self, complexity: float) -> str:
        for (low, high), label in self.COMPLEXITY_LABELS.items():
            if low <= complexity < high:
                return label
        return "Unknown"

    def _calculate_confidence(self, task_type: str, complexity: float) -> float:
        """Confidence is higher for moderate complexity and common task types."""
        base_confidence = 0.85
        if complexity < 1.0 or complexity > 9.0:
            base_confidence -= 0.15  # Extreme values = less confident
        if task_type == "GPU":
            base_confidence -= 0.05  # GPU tasks are more variable
        return round(max(0.5, min(0.99, base_confidence + np.random.uniform(-0.03, 0.03))), 2)

    def predict(self, task_type: str, priority: int, complexity: float) -> dict:
        """
        Returns prediction dict with estimated time, confidence, and label.
        """
        encoded_type = self._encode_task_type(task_type)
        features = np.array([[encoded_type, priority, complexity]])
        features_scaled = self.scaler.transform(features)

        ml_prediction = float(self.model.predict(features_scaled)[0])

        # Heuristic correction layer
        config = self.BASE_TIMES[task_type]
        priority_factor = 1.0 - (priority - 1) * config["priority_sensitivity"] * 0.08
        heuristic_estimate = config["base"] * complexity * 0.3 * priority_factor

        # Blend: 60% ML, 40% heuristic
        final_estimate = (0.6 * ml_prediction) + (0.4 * heuristic_estimate)
        final_estimate = round(max(1.0, final_estimate), 2)

        return {
            "estimated_time": final_estimate,
            "confidence": self._calculate_confidence(task_type, complexity),
            "complexity_label": self._get_complexity_label(complexity),
        }
