document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function createActivityCard(name, details) {
    const activityCard = document.createElement("article");
    activityCard.className = "activity-card";

    const cardHeader = document.createElement("div");
    cardHeader.className = "activity-card-header";

    const title = document.createElement("h4");
    title.textContent = name;
    cardHeader.appendChild(title);

    const spotsLeft = details.max_participants - details.participants.length;
    const availability = document.createElement("span");
    availability.className = "availability";
    availability.textContent = `${spotsLeft} spots left`;
    cardHeader.appendChild(availability);
    activityCard.appendChild(cardHeader);

    const description = document.createElement("p");
    description.className = "activity-description";
    description.textContent = details.description;
    activityCard.appendChild(description);

    const schedule = document.createElement("p");
    schedule.className = "activity-schedule";
    const scheduleLabel = document.createElement("strong");
    scheduleLabel.textContent = "Schedule";
    schedule.append(scheduleLabel, document.createTextNode(details.schedule));
    activityCard.appendChild(schedule);

    const participantsSection = document.createElement("div");
    participantsSection.className = "participants-section";
    const participantsHeading = document.createElement("h5");
    participantsHeading.textContent = `Participants (${details.participants.length})`;
    participantsSection.appendChild(participantsHeading);

    const participantList = document.createElement("ul");
    participantList.className = "participant-list";
    if (details.participants.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.className = "empty-participants";
      emptyMessage.textContent = "No participants yet";
      participantList.appendChild(emptyMessage);
    } else {
      details.participants.forEach((participant) => {
        const listItem = document.createElement("li");
        listItem.className = "participant-item";

        const participantEmail = document.createElement("span");
        participantEmail.textContent = participant;
        listItem.appendChild(participantEmail);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-participant-button";
        removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
        removeButton.title = "Unregister participant";
        removeButton.dataset.activity = name;
        removeButton.dataset.email = participant;

        const removeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        removeIcon.setAttribute("viewBox", "0 0 20 20");
        removeIcon.setAttribute("aria-hidden", "true");
        const removePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        removePath.setAttribute("d", "M5 5l10 10M15 5L5 15");
        removeIcon.appendChild(removePath);
        removeButton.appendChild(removeIcon);
        listItem.appendChild(removeButton);

        participantList.appendChild(listItem);
      });
    }
    participantsSection.appendChild(participantList);
    activityCard.appendChild(participantsSection);

    return activityCard;
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren(new Option("-- Select an activity --", ""));
      Object.entries(activities).forEach(([name, details]) => {
        activitiesList.appendChild(createActivityCard(name, details));

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

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".remove-participant-button");
    if (!removeButton) {
      return;
    }

    const { activity, email } = removeButton.dataset;
    removeButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister participant");
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      await fetchActivities();
    } catch (error) {
      removeButton.disabled = false;
      messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      console.error("Error unregistering participant:", error);
    }

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

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
        await fetchActivities();
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
