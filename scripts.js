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


// ***** Install PWA on device with button *****

let deferredPrompt;
const installButton = document.getElementById("install_button");

window.addEventListener("beforeinstallprompt", e => {
	console.log("beforeinstallprompt fired");
	e.preventDefault();
	// Stash the event so it can be triggered later.
	deferredPrompt = e;
	// Show the install button
	// installButton.hidden = false;
	installButton.style.display = "inline";
	installButton.addEventListener("click", installApp);
});

function installApp() {
	// Show the prompt
	deferredPrompt.prompt();
	installButton.disabled = true;
  
	// Wait for the user to respond to the prompt
	deferredPrompt.userChoice.then(choiceResult => {
	  if (choiceResult.outcome === "accepted") {
		console.log("PWA setup accepted");
		// installButton.hidden = true;
		installButton.style.display = "none";
	  } else {
		console.log("PWA setup rejected");
	  }
	  installButton.disabled = false;
	  deferredPrompt = null;
	});
}

window.addEventListener("appinstalled", evt => {
	console.log("appinstalled fired", evt);
});


// ********* Background Sync *************

// Get Permissions
function registerNotification() {
	Notification.requestPermission(permission => {
		if (permission === 'granted'){ registerBackgroundSync() }
		else console.error("Permission was not granted.")
	})
}

function registerBackgroundSync() {
    if (!navigator.serviceWorker){
        return console.error("Service Worker not supported")
    }

    navigator.serviceWorker.ready
    .then(registration => registration.sync.register('syncAttendees'))
    .then(() => console.log("Registered background sync"))
    .catch(err => console.error("Error registering background sync", err))
}