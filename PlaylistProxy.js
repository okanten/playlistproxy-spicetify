(function playlistProxy() {

    function createPlaylist(playlistUrl, playlistName) {
        const requestBody = JSON.stringify({
            'name': playlistName || "",
            'description': null,
            'url': playlistUrl,
        });
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: '*/*',
                Referer: 'https://xpui.app.spotify.com/',
            },
            body: requestBody
        };

        fetch('https://api.playlistproxy.net/create-playlist', options)
            .then(response => response.json())
            .then(response => {
                if (response.message) throw new Error(response.message);
                clonePlaylist(response.playlistId, response.playlistPassword);
            })
            .catch(err => {
                console.error(err);
                const message = err.message || "Unknown error";
                Spicetify.showNotification(message, true, 5000);
            });
        return;
    }

    function clonePlaylist(playlistId, password) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: '*/*',
                Referer: 'https://xpui.app.spotify.com/',
            },
            body: JSON.stringify({
                'playlistId': playlistId,
                'playlistPassword': password
            })
        };

        fetch('https://api.playlistproxy.net/clone-playlist', options)
            .then(response => response.json())
            .then(response => {
                if (response.message) throw new Error(response.message);
                let playlistUrl = response.playlistUrl;
                playlistUrl = playlistUrl.replace("https://open.spotify.com", "");
                console.log(playlistUrl);
                Spicetify.showNotification("Playlist created and cloned!", false, 1000);
                Spicetify.Platform.History.push(playlistUrl)
            })
            .catch(err => {
                console.error(err);
                const message = err.message || "Unknown error";
                Spicetify.showNotification(message, true, 5000);
            });
        return;
    }

    function makeAndClonePlaylist(uris, playlistName) {
        const playlistURI = uris[0];
        createPlaylist(playlistURI, playlistName);
    }


    function addEventListeners(execFunc) {
        console.log("[PlaylistProxy]: Adding listeners");
        const playlistName = document.getElementById("playlistName");

        const btn = document.getElementById("confirmCloneBtn");
        if (btn) {
            btn.addEventListener("click", function (event) {
                execFunc([document.getElementById("playlistProxyPlaylistUri").value], playlistName.value);
                Spicetify.showNotification("Anonymizing playlist - please wait", false, 10000);
                Spicetify.PopupModal.hide();
                event.preventDefault();
            }, false);
        }
    }

    function createModalContent(playlistUri) {
        let style = document.createElement("style");
        style.innerHTML = `
            input {
                width: 100%;
                border: 1px solid #ccc;
                border-radius: 4px;
                margin: 0.5em 0;
                padding: 0.5em;
            }
            button {
                width: 75%;
                border: none;
                padding: 0.5em;
                border-radius: 4px;
                background-color: #4CAF50;
                color: white;
                cursor: pointer;
            }
            .cancel-btn {
                background-color: #f44336;
            }

            .playlistProxyButtons {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                width: 100%;
            }
        `;

        let modalContent = document.createElement("div");
        modalContent.innerHTML = `
            <input type="text" id="playlistName" placeholder="Playlist Name" />
            <input type="text" id="playlistProxyPlaylistUri" value="${playlistUri}" hidden />
            <div class="playlistProxyButtons">
                <button class="cancel-btn" onclick="Spicetify.PopupModal.hide()">Cancel</button>
                <button id="confirmCloneBtn">Anonymize</button>
            </div>
        `;
        modalContent.appendChild(style);

        return modalContent;
    }

    function showModal(uris) {
        const playlistURI = uris[0];
        Spicetify.PopupModal.display({
            title: "Anonymize Playlist",
            content: createModalContent(playlistURI),
            isLarge: false
        });
        addEventListeners(makeAndClonePlaylist);
    }

    function displayContextMenu(uris) {
        if (uris.length > 1) return false;

        const obj = Spicetify.URI.fromString(uris[0]);

        switch (obj.type) {
            case Spicetify.URI.Type.PLAYLIST:
            case Spicetify.URI.Type.PLAYLIST_V2:
                return true;
            default:
                return false;
        }
    }
    
    const anonButton = new Spicetify.ContextMenu.Item(
        "Anonymize via PlaylistProxy.net",
        showModal,
        displayContextMenu
    );

    anonButton.register();
})();
