const API_ROOT = "https://reqres.in/api/";
const nbMaxAttendees = 30;

function fetchAttendees(){
	return fetch(API_ROOT + `users`)
		.then(res => res.json())
		.then(res => res.data || [])
}

function renderAttendees(attendees=[]){
	const attendeesSection = document.getElementById("attendees");
	attendeesSection.innerHTML = `
	<h1>Attendees: ${attendees.length} / ${nbMaxAttendees}</h1>
	<ul>
		${attendees.map(user => `
		<li class='card'>
			<img src="${user.avatar}" alt="Avatar" class="avatar">
			<p>
				<span class="firstname">${user.first_name}</span>
				<br>
				<span class="lastname">${user.last_name}</span>
			</p>
		</li>
		`).join('')}
	</ul>
	`

	const registerSection = document.getElementById("register");
	const isFull = (attendees.length >= nbMaxAttendees);
	registerSection.querySelectorAll("input, button").forEach(elm => { elm.disabled = isFull });
	registerSection.querySelector(".status").innerHTML = isFull
		? `Sorry, this event is full.`
		: `Some places are still available for you to register for this event.`
}

document.addEventListener("DOMContentLoaded", () => {
	fetchAttendees().then(renderAttendees);


});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js")
    .then(serviceWorker => {
        console.log("Service Worker registered: ", serviceWorker);
    })
    .catch(error => {
        console.error("Error registering the Service Worker: ", error);
    });
}

navigator.serviceWorker.onmessage = event => {
	const message = JSON.parse(event.data);
	
	// detect the type of message and refresh the view
	if(message && message.type.includes("/api/users")){
		console.log("List of attendees to date", message.data)
		renderAttendees(message.data)
	}
};