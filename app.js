'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnEdit = document.querySelector('.btn-edit');
const btnSave = document.querySelector('.btn-save');


class Workout {
    constructor(coords, duration, distance) {
        this.coords = coords;
        this.duration = duration;
        this.distance = distance;
        this.date = new Date();
        this.id = (Date.now() + '').slice(-10);
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    constructor(coords, duration, distance, cadence) {
        super(coords, duration, distance);
        this.cadence = cadence;
        this.type = 'running';
        // --------------------
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    constructor(coords, duration, distance, elevationGain) {
        super(coords, duration, distance);
        this.elevationGain = elevationGain;
        this.type = 'cycling';
        // --------------------
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}


class App {
    constructor() {
        this.map;
        this.mapEvent;
        this.workouts = [];
        this.mapZoomLevel = 13;
        this.markers = [];
        // ------------------
        // Get users position
        this._getPosition();
        // Get local storage
        this._getLocalStorage();
        // Attach event handlers
        inputType.addEventListener('change', this._toggleElevationField);
        form.addEventListener('submit', this._newWorkout.bind(this));
        containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
        containerWorkouts.addEventListener('click', this._showOptions.bind(this));
    }

    _getPosition() {
        if (navigator) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
                console.log('Unable to locate your position');
            })
        }
    }

    _loadMap(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const coords = [lat, lon]

        this.map = L.map('map').setView(coords, this.mapZoomLevel);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        this.map.on('click', this._showForm.bind(this));

        this.workouts.forEach(work => this._renderMarker(work));
    }

    _showForm(mapE) {
        this.mapEvent = mapE;

        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => {
            form.style.display = 'grid';
        }, 1000);

    }

    _toggleElevationField() {
        inputCadence.closest('.form__row ').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkout(e) {
        e.preventDefault();

        const isValid = (...inputs) => inputs.every(inp => Number.isFinite(inp)); // return bool
        const isPositive = (...inputs) => inputs.every(inp => inp > 0); // return bool

        // 1. Get the form inputs
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;
        const { lat, lng } = this.mapEvent.latlng;
        const coords = [lat, lng];

        // 2. Validate the form inputs

        // 3. Create a new running object
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (!isValid(distance, duration, cadence) || !isPositive(distance, duration, cadence)) return alert('Input is required to be a positive number');

            workout = new Running(coords, duration, distance, cadence);
        };

        // 4. Create a new cycling object
        if (type === 'cycling') {
            const elevationGain = +inputElevation.value;
            if (!isValid(distance, duration, elevationGain) || !isPositive(distance, duration)) return alert('Input is required to be number');

            workout = new Cycling(coords, duration, distance, elevationGain);
        };

        // 4b. Add new workout into the workout array
        this.workouts.push(workout);

        // 5. Render marker
        this._renderMarker(workout);

        // 6. Render Workout
        this._renderWorkout(workout);

        // 7. Hide the form and clear the input fields
        this._hideForm();

        // 8. Local Storage
        this._setLocalStorage();
    }

    _renderMarker(workout) {

        const marker = L.marker(workout.coords).addTo(this.map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();

        this.markers.push(marker);
    }

    _renderWorkout(workout) {
        let html = `

        <li class="workout workout--${workout.type}" data-id='${workout.id}'>
            <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__temporary">
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                <span class="workout__value value--distance">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value value--duration">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>           
        `

        if (workout.type === 'running')
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value value--pace">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value value--cadence">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
            </div>
        `

        if (workout.type === 'cycling')
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value value--speed">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value value--elevationGain">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
        </div> 
        `;

        html += `
        <div class="workout__options">
              <button class="workout__button btn-edit">Edit</button>
              <button class="workout__button btn-save">Save</button>
              <button class="workout__button btn-delete">Delete</button>
            </div>
           
       `
        html += `
        
        </li>`
        form.insertAdjacentHTML('afterend', html);
    }

    _moveToPopUp(e) {
        const workout = e.target.closest('.workout');
        if (!workout) return;

        const workoutId = workout.dataset.id;
        const clickedWorkout = this.workouts.find(el => el.id === workoutId).coords;

        this.map.setView(clickedWorkout, this.mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        });
    }

    _showOptions(e) {
        const workout = e.target.closest('.workout');
        const target = e.target;
        const nextSibling = target.nextElementSibling;
        const previousSibling = target.previousElementSibling;
        if (e.target.classList.contains('btn-delete')) {
            this._deleteWorkout(workout);
            // this._updateUI(workout);
        }
        if (e.target.classList.contains('btn-edit')) {
            this._editWorkout(workout, target, nextSibling);

        }
        if (e.target.classList.contains('btn-save')) {
            this._updateWorkout(workout, target, previousSibling);
        }
    }

    _deleteWorkout(workout) {
        // Find workout
        const clickedWorkoutIndex = this.workouts.findIndex(work => work.id === workout.dataset.id);

        // remove from workouts array
        this.workouts.splice(clickedWorkoutIndex, 1);

        // Update UI
        this._updateUI(workout);

        // Remove marker
        this._removeMarker(clickedWorkoutIndex)

        // update local storage
        this._setLocalStorage();
    }

    _updateUI(removedWorkout) {
        if (!removedWorkout) return;

        removedWorkout.parentElement.removeChild(removedWorkout);
    }

    _removeMarker(index) {
        // remove marker from map layer
        this.map.removeLayer(this.markers[index]);

        // remove marker from marker array
        this.markers.splice(index, 1)
    }

    _editWorkout(workout, editButtonEl, saveButtonEl) {
        // 1. Add the style edit classname
        workout.classList.add('editWorkout')

        // 2. Toggle to save button
        editButtonEl.style.display = 'none';
        saveButtonEl.style.display = 'block';

        // 3. make all text fields editable
        workout.querySelectorAll('div').forEach(el => {
            if (el.classList.contains('workout__details')) {
                const spans = el.querySelectorAll('span')
                spans.forEach(el => {
                    if (el.classList.contains('value--pace')) return;

                    if (el.classList.contains('value--speed')) return;

                    if (el.classList.contains('workout__value')) {
                        el.classList.add('workout__edit--value');
                        el.setAttribute("contenteditable", "true")
                    }
                });
            }
        })
    }

    _updateWorkout(workout, saveButtonEl, editButtonEl) {

        // 1. Find workout Object
        const workoutObject = this.workouts.find(el => el.id === workout.dataset.id);

        // 2. Get the values fields
        const workoutDivs = workout.querySelectorAll('div');
        const workoutValues = [...workoutDivs].find(el => {
            el.classList.contains('.workout__options')
            return el
        }).querySelectorAll('span');

        const spanValues = [...workoutValues].filter(el => el.classList.contains('workout__value'));

        const valuesArray = [...spanValues];

        // 3. Set the values in the object
        if (workoutObject.type === 'running') {
            valuesArray.forEach(el => {
                if (el.classList.contains('value--distance')) workoutObject.distance = el.textContent;
                if (el.classList.contains('value--duration')) workoutObject.duration = el.textContent;
                if (el.classList.contains('value--pace')) {
                    workoutObject.pace = workoutObject.duration / workoutObject.distance;
                    el.textContent = workoutObject.pace.toFixed(1);
                }
                if (el.classList.contains('value--cadence')) workoutObject.cadence = el.textContent;
            })
        }

        if (workoutObject.type === 'cycling') {
            valuesArray.forEach(el => {
                if (el.classList.contains('value--distance')) workoutObject.distance = el.textContent;
                if (el.classList.contains('value--duration')) workoutObject.duration = el.textContent;
                if (el.classList.contains('value--speed')) {
                    workoutObject.speed = workoutObject.distance / (workoutObject.duration / 60);
                    el.textContent = workoutObject.speed.toFixed(1);
                }
                if (el.classList.contains('value--elevationGain')) workoutObject.elevationGain = el.textContent;
            })
        }

        // 4. Remove edit class
        workout.classList.remove('editWorkout');
        workout.classList.remove('workout__edit--value');

        // 5. toggle save/edit buttons
        editButtonEl.style.display = 'block';
        saveButtonEl.style.display = 'none';

        // 6. remove workout__edit--value class
        valuesArray.forEach(el => {
            el.classList.remove('workout__edit--value');
            el.setAttribute("contenteditable", "false")
        })

        // 7. set local storage
        this._setLocalStorage();

    }

    _setLocalStorage() {
        localStorage.setItem('workout', JSON.stringify(this.workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workout'));

        if (!data) return;

        this.workouts = data;

        this.workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }

    reset() {
        localStorage.removeItem('workout');
        location.reload();
    }


}


const app = new App();