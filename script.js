"use strict";

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const ZOOMLEVEL = 13;

class Workout {
	date = new Date();
	id = (Date.now() + "").slice(-10);
	clicks = 0;
	constructor(coords, distance, duration) {
		this.coords = coords; // [lat, lng]
		this.distance = distance; // in km
		this.duration = duration; // in min
		this.description = "";
	}

	_setDescription() {
		const months = [
			"January",
			"February",
			"March",
			"April",
			"May",
			"June",
			"July",
			"August",
			"September",
			"October",
			"November",
			"December",
		];

		this.description = `${this.type[0].toUpperCase()}${this.type.slice(
			1
		)} on ${months[this.date.getMonth()]} ${this.date.getDay()}`;
	}

	_click() {
		this.clicks++;
	}
}

class Running extends Workout {
	type = "running";
	constructor(coords, distance, duration, cadance) {
		super(coords, distance, duration);
		this.cadance = cadance;
		this.pace = null;

		this.calcPace();
		this._setDescription();
	}

	calcPace() {
		// min/km
		this.pace = this.duration / this.distance;
		return this.pace;
	}
}
class Cycling extends Workout {
	type = "cycling";
	constructor(coords, distance, duration, elevationGain) {
		super(coords, distance, duration);
		this.elevationGain = elevationGain;
		this.speed = null;

		this.calcSpeed();
		this._setDescription();
	}

	calcSpeed() {
		// km/h
		this.speed = this.distance / (this.duration / 60);
		return this.speed;
	}
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const run2 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, run2);

// ****************************************************************
// APPLICATION ARCHITECTURE
class App {
	#map;
	#mapEvent;
	#workouts = [];
	constructor() {
		this._getPosition();

		// Get local data storage
		this._getLocalStore();

		// Setup event listeners
		form?.addEventListener("submit", this._newWorkout.bind(this));
		inputType?.addEventListener("change", this._toggleElevationField);

		containerWorkouts?.addEventListener(
			"click",
			this._moveToPopup.bind(this)
		);
	}

	_getPosition() {
		navigator.geolocation.getCurrentPosition(
			this._loadMap.bind(this),
			// Could not get geo location
			() => {
				console.log("Could not get your location");
			}
		);
	}

	_loadMap(pos) {
		const { latitude, longitude } = pos.coords;

		this.#map = L.map("map").setView([latitude, longitude], ZOOMLEVEL);

		L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(this.#map);

		// Handle clicks on map
		this.#map.on("click", this._showForm.bind(this));

		this.#workouts.forEach((e) => {
			this._renderWorkout(e);
			this._renderWorkoutMarker(e);
		});
	}

	_showForm(e) {
		this.#mapEvent = e;
		form?.classList.remove("hidden");
		inputDistance?.focus();
	}

	_resetForm() {
		inputDistance.value =
			inputCadence.value =
			inputDuration.value =
			inputElevation.value =
				"";

		// Hide form again
		form.style.display = "none";
		form?.classList.add("hidden");
		setTimeout(() => (form.style.display = "grid"), 1000);
	}

	_toggleElevationField() {
		inputElevation
			?.closest(".form__row")
			?.classList.toggle("form__row--hidden");
		inputCadence
			?.closest(".form__row")
			?.classList.toggle("form__row--hidden");
	}

	_newWorkout(e) {
		const posNum = (...inp) => inp.every((i) => i > 0);
		const isNum = (...inputs) => inputs.every((i) => Number.isFinite(i));

		e.preventDefault();

		const type = inputType.value;
		const dist = +inputDistance.value;
		const dura = +inputDuration.value;
		const { lat, lng } = this.#mapEvent.latlng;

		let workout;

		// IF the workout is a running workout
		if (type === "running") {
			const cade = +inputCadence.value;

			if (!isNum(dist, dura, cade) || !posNum(dist, dura, cade))
				return alert("Inputs have to be positive numbers!");

			workout = new Running([lat, lng], dist, dura, cade);
		}

		// If the workout is a cycling workout
		if (type === "cycling") {
			const elev = +inputElevation.value;

			if (!isNum(dist, dura, elev) || !posNum(dist, dura))
				return alert("Inputs have to be positive numbers!");

			workout = new Cycling([lat, lng], dist, dura, elev);
		}

		// Push the new workout
		this.#workouts.push(workout);

		this._renderWorkoutMarker(workout);

		this._renderWorkout(workout);

		this._resetForm();

		this._localStore();
	}

	_renderWorkoutMarker(workout) {
		L.marker(workout.coords)
			.addTo(this.#map)
			.bindPopup(
				L.popup({
					maxWidth: 250,
					minWidth: 100,
					autoClose: false,
					closeOnClick: false,
					className: `${workout.type}-popup`,
				})
			)
			.setPopupContent(
				`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${
					workout.description
				}`
			)
			.openPopup();
	}

	_renderWorkout(workout) {
		let html = `
		<li class="workout workout--${workout.type}" data-id="${workout.id}">
			<h2 class="workout__title">${workout.description}</h2>
			<div class="workout__details">
				<span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
				<span class="workout__value">${workout.distance}</span>
				<span class="workout__unit">km</span>
			</div>
			<div class="workout__details">
				<span class="workout__icon">⏱</span>
				<span class="workout__value">${workout.duration}</span>
				<span class="workout__unit">min</span>
			</div>
		`;

		if (workout.type === "running") {
			html += `
				<div class="workout__details">
					<span class="workout__icon">🦶🏼</span>
					<span class="workout__value">${workout.pace.toFixed(1)}</span>
					<span class="workout__unit">spm</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span	span class="workout__value">${workout.cadance}</span>
					<span class="workout__unit">min/km</span>
				</div>
			</li>
			`;
		} else {
			html += `
				<div class="workout__details">
					<span class="workout__icon">⚡️</span>
					<span class="workout__value">${workout.speed.toFixed(1)}</span>
					<span class="workout__unit">km/h</span>
				</div>
				<div class="workout__details">
					<span class="workout__icon">⛰</span>
					<span class="workout__value">${workout.elevationGain}</span>
					<span class="workout__unit">m</span>
				</div>
			</li>
			`;
		}

		form?.insertAdjacentHTML("afterend", html);
	}

	_moveToPopup(e) {
		const workoutEl = e.target.closest(".workout");

		if (!workoutEl) return;

		const workout = this.#workouts.find(
			(w) => w.id === workoutEl.dataset.id
		);

		this.#map.setView(workout.coords, ZOOMLEVEL, {
			animate: true,
			pan: {
				duration: 1,
			},
		});

		// Objects from local storage or from stringified json loose prototype chain
		// workout._click();
	}

	_localStore() {
		localStorage.setItem("workouts", JSON.stringify(this.#workouts));
	}

	_getLocalStore() {
		const data = JSON.parse(localStorage.getItem("workouts"));
		if (!data) return;

		this.#workouts = data;
		this.#workouts.forEach((e) => {
			this._renderWorkout(e);
			// this._renderWorkoutMarker(e);
		});
	}

	reset() {
		localStorage.removeItem("workouts");
		location.reload();
	}
}

const app = new App();
