'use strict';



const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class Workout {
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
        this.date = new Date();
        this.id = (Date.now() + '').slice(-10);

    }

    // Running on April 14<
    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const monthIndex = this.date.getMonth();

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} ${months[monthIndex]} ${this.date.getDate()}`;
    }
}

class Running extends Workout {
    constructor(coords, distance, duration, cadence, ) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.type = 'running';
        // -----------------
        this.calcPace();
        this._setDescription();
    }

    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace
    }
}

class Cycling extends Workout {
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.type = 'cycling';
        // --------------------
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed
    }
}


class App {
    constructor() {
        this.map;
        this.mapEvent;
        this.mapZoom = 14;
        this.workouts = [];
        this._getPosition();
        // this._getLocalStorage();
        // setTimeout(() => {
        //     this._getLocalStorage();
        // }, 3000);
        // //////////////////
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleForm);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
        containerWorkouts.addEventListener('click', this._showOptions.bind(this));
    }

    _getPosition() {
        if (!navigator) return
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
            console.log('Error registering current position');
        })
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];

        this.map = L.map('map').setView(coords, this.mapZoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Show the form
        this.map.on('click', this._showForm.bind(this))
    }

    _toggleForm() {
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _showForm(mapE) {
        this.mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm() {
        form.classList.add('hidden');
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
    }

    _newWorkout(e) {
        e.preventDefault();

        // VALIDATION
        // 1. Check values are all numerical using the arr.every method which will check that every el is a number value and return either T/F

        const isValid = (...inputs) => inputs.every(input => Number.isFinite(input));

        // 2. Check values are positive values using the arr.every method to check every el is > 0 and will return either T/F
        const isPositive = (...inputs) => inputs.every(input => input > 0);

        let workout;

        const type = inputType.value;
        const duration = +inputDuration.value;
        const distance = +inputDistance.value;

        const { lat, lng } = this.mapEvent.latlng;
        const coords = [lat, lng]

        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (!isValid(duration, distance, cadence) || !isPositive(duration, distance, cadence)) return

            // 1. create a new running object and add to workouts list
            workout = new Running(coords, distance, duration, cadence)
        }

        if (type === 'cycling') {
            const elevationGain = +inputElevation.value;
            if (!isValid(duration, distance, elevationGain) || !isPositive(duration, distance)) return

            // 1. create a new cycling object and add to the workouts list
            workout = new Cycling(coords, distance, duration, elevationGain);
        }

        this.workouts.push(workout);

        this._hideForm();

        this._renderMarker(workout);

        this._renderWorkout(workout);

        this._setLocalStorage();

    }

    _renderMarker(workout) {

        workout.marker = L.marker(workout.coords).addTo(this.map)
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

        // console.log(workout);
    }

    _renderWorkout(workout) {
        let html = `

        <li class="workout workout--${workout.type}" data-id='${workout.id}'>
            <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__container">
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>          
        `

        if (workout.type === 'running')
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
            </div>
        `

        if (workout.type === 'cycling')
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
        </div> 
        `;

        html += `
        <div class="workout__options">
                    <button class="workout__button btn-edit">Edit</button>
                    <button class="workout__button btn-delete">Delete</button>
            </div>
        </li>`

        form.insertAdjacentHTML('afterend', html);
    }



    // _renderLocalStorageMarker(workouts) {
    //     workouts.forEach(work => this._renderMarker(work))
    // }

    _moveToPopup(e) {
        const workout = e.target.closest('.workout');
        if (!workout) return;

        const workoutID = workout.dataset.id;
        const targetWorkout = this.workouts.find(el => el.id === workoutID);
        if (!targetWorkout) return
        const targetWorkoutCoords = targetWorkout.coords;

        this.map.setView(targetWorkoutCoords, this.mapZoom, {
            animate: true,
            pan: {
                duration: 1
            }
        });
    }

    _showOptions(e) {
        let workout;

        if (e.target.classList.contains('btn-delete')) {
            workout = e.target.closest('.workout');
            this._deleteWorkout(workout);
        }
        if (e.target.classList.contains('btn-edit')) {
            console.log('edit button clicked');
        }
    }

    _deleteWorkout(workout) {
        const workoutID = workout.dataset.id;
        // 1. Remove workout from this.workouts array
        const findWorkout = this.workouts.find(el => el.id === workoutID);

        // Find workout Index
        const removeWorkout = this.workouts.findIndex(el => el.id === workoutID);

        // Splice Workout from workouts array
        this.workouts.splice(removeWorkout, 1);

        // 2. update the UI
        this._updateUI(workout);
        // 3. Remove the marker from the map
        this.map.removeLayer(findWorkout.marker)
    }

    _updateUI(item) {
        if (!item) return;
        item.parentElement.removeChild(item);
    }

    _setLocalStorage() {
        if (!this.workouts < 0) return;
        localStorage.setItem('workout', JSON.stringify(this.workouts));
    }

    _getLocalStorage() {
        // get the list
        const storage = JSON.parse(localStorage.getItem('workouts'));

        console.log(storage, 'Storage');
        // if there is a list then render each workout
        if (!storage) return;

        this.workouts = storage;

        this.workouts.forEach(workout => {
            this._renderWorkout(workout);
        })

        // this._renderLocalStorageMarker(this.workouts)
    }

}

const app = new App();