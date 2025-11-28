document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";

          const spotsLeft = details.max_participants - details.participants.length;

          // Header and description
          const title = document.createElement("h4");
          title.textContent = name;

          const desc = document.createElement("p");
          desc.textContent = details.description;

          const schedule = document.createElement("p");
          schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

          const availability = document.createElement("p");
          availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

          const participantsLabel = document.createElement("p");
          participantsLabel.innerHTML = `<strong>Participants:</strong>`;

          const ul = document.createElement("ul");
          ul.className = "participants";

          // Populate participants with delete button
          details.participants.forEach((participant) => {
            const li = document.createElement("li");

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = participant;

            const delButton = document.createElement("button");
            delButton.className = "participant-delete";
            delButton.setAttribute("aria-label", `Unregister ${participant}`);
            delButton.textContent = "🗑️";

            // Click handler to unregister participant
            delButton.addEventListener("click", async () => {
              if (!confirm(`Unregister ${participant} from ${name}?`)) return;

              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );

                const result = await resp.json();

                if (resp.ok) {
                  // Refresh activities to update UI
                  fetchActivities();
                } else {
                  console.error("Failed to unregister:", result);
                  alert(result.detail || "Failed to unregister participant");
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                alert("Error unregistering participant. Check console for details.");
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delButton);
            ul.appendChild(li);
          });

          // Assemble card
          activityCard.appendChild(title);
          activityCard.appendChild(desc);
          activityCard.appendChild(schedule);
          activityCard.appendChild(availability);
          activityCard.appendChild(participantsLabel);
          activityCard.appendChild(ul);

          activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
