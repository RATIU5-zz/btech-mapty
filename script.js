"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

let map, mapEvent;

class App {
	constructor() {}

	_getPosition() {
		navigator.geolocation.getCurrentPosition(
			this._loadMap,
			// Could not get geo location
			() => {
				console.log("Could not get your location");
			}
		);
	}

	_loadMap(pos) {
		const { latitude, longitude } = pos.coords;

		map = L.map("map").setView([latitude, longitude], 13);

		L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		}).addTo(map);

		// Handle clicks on map
		map.on("click", (e) => {
			mapEvent = e;
			form?.classList.remove("hidden");
			inputDistance?.focus();
		});
	}

	_showForm() {}

	_toggleElevationField() {}

	_newWorkout() {}
}

const app = new App();

form?.addEventListener("submit", (e) => {
	e.preventDefault();

	inputDistance.value =
		inputCadence.value =
		inputDuration.value =
		inputElevation.value =
			"";

	const { lat, lng } = mapEvent.latlng;
	L.marker([lat, lng])
		.addTo(map)
		.bindPopup(
			L.popup({
				maxWidth: 250,
				minWidth: 100,
				autoClose: false,
				closeOnClick: false,
				className: "running-popup",
			})
		)
		.setPopupContent("Workout")
		.openPopup();
});

inputType?.addEventListener("change", (_) => {
	inputElevation
		?.closest(".form__row")
		?.classList.toggle("form__row--hidden");
	inputCadence?.closest(".form__row")?.classList.toggle("form__row--hidden");
});
