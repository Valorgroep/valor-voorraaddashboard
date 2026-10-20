/* =========================================================
   VALOR VOORRAAD - FASE 1 PROTOTYPE
   Voorraad per afvalstroom:
   - Op vloer (m³)
   - 30/40 m³ vol (aantal)

   Data wordt lokaal opgeslagen in de browser.
========================================================= */

const STORAGE_KEY = "valorStockListsV2";
const MAX_DAYS = 7;


/* =========================================================
   AFVALSTROMEN
========================================================= */

const allStreams = [
    { id: "bouw-en-sloop", name: "Bouw en Sloop" },
    { id: "bedrijfsafval", name: "Bedrijfsafval" },
    { id: "bedrijfsafval-grof-sittard", name: "Bedrijfsafval grof voor Sittard" },
    { id: "bedrijfsafval-grof-arn", name: "Bedrijfsafval grof voor ARN" },
    { id: "technisch-niet-verbrandbaar", name: "Technisch niet verbrandbaar" },
    { id: "volumineus-afval", name: "Volumineus afval" },
    { id: "a-hout", name: "A-Hout" },
    { id: "b-hout", name: "B-Hout" },
    { id: "c-hout", name: "C-Hout" },
    { id: "vloerbedekking", name: "Vloerbedekking" },
    { id: "vloerbedekking-zwart", name: "Vloerbedekking Zwart" },
    { id: "metalen", name: "Metalen" },
    { id: "tempex", name: "Tempex" },
    { id: "huisvuil", name: "Huisvuil" },
    { id: "gft", name: "GFT" },
    { id: "pmd", name: "PMD" },
    { id: "karton", name: "Karton" },
    { id: "papier-bont", name: "Papier Bont" },
    { id: "vlak-glas", name: "Vlak glas" },
    { id: "groen-glas", name: "Groen glas" },
    { id: "bruin-glas", name: "Bruin glas" },
    { id: "wit-glas", name: "wit glas" },
    { id: "bont-glas", name: "Bont glas" },
    { id: "folie-bont", name: "folie Bont" },
    { id: "folie-blank", name: "Folie Blank" },
    { id: "big-bags", name: "big Bags" }
];

const mainStreams = allStreams;
const otherStreams = [];


/* =========================================================
   APP STATE
========================================================= */

let state = {
    view: "terrain",
    page: "home",
    editingId: null,
    draft: null
};


/* =========================================================
   ELEMENTEN
========================================================= */

const app = document.getElementById("app");
const toast = document.getElementById("toast");
const confirmModal = document.getElementById("confirmModal");
const editExistingBtn = document.getElementById("editExistingBtn");


/* =========================================================
   DATUM / TIJD
========================================================= */

function pad(n) {
    return String(n).padStart(2, "0");
}

function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDate(key) {
    const [y, m, d] = key.split("-");
    return `${d}-${m}-${y}`;
}

function formatTime(date = new Date()) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getRecentDateKeys() {
    const keys = [];
    const today = new Date();

    for (let i = 0; i < MAX_DAYS; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        keys.push(dateKey(d));
    }

    return keys;
}


/* =========================================================
   OPSLAAN / LADEN
========================================================= */

function loadLists() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
        return JSON.parse(saved);
    }

    const demo = createDemoLists();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(demo)
    );

    return demo;
}

function saveLists(lists) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(lists)
    );
}


/* =========================================================
   DEMO DATA
========================================================= */

function createDemoLists() {

    const now = new Date();
    const key = dateKey(now);

    const streams = {};

    allStreams.forEach(stream => {
        streams[stream.id] = {
            floor: 0,
            full3040: 0
        };
    });

    // Voorbeeldwaarden
    streams["pmd"] = {
        floor: 85,
        full3040: 1
    };

    streams["a-hout"] = {
        floor: 150,
        full3040: 2
    };

    streams["karton"] = {
        floor: 70,
        full3040: 1
    };

    return [
        {
            id: "demo-1",
            date: key,
            location: "Uden",
            createdAt: formatTime(now),
            updatedAt: formatTime(now),
            status: "verstuurd",

            note: "Voorraad bijgewerkt voor de ochtendplanning.",

            streams: streams
        }
    ];
}


/* =========================================================
   LIJSTEN
========================================================= */

function getLists() {

    return loadLists().sort(
        (a, b) =>
            b.date.localeCompare(a.date)
    );
}

function findTodayList() {

    return getLists().find(
        x => x.date === dateKey()
    );
}

function getStream(id) {

    return allStreams.find(
        x => x.id === id
    );
}


/* =========================================================
   STATUS
========================================================= */

function statusForStream(stream, value) {

    if (!value) {
        return {
            label: "Normaal",
            className: "green"
        };
    }

    const full = Number(
        value.full3040 || 0
    );

    const floor = Number(
        value.floor || 0
    );

    if (full > 0) {
        return {
            label: "Volle bak aanwezig",
            className: "orange"
        };
    }

    if (floor >= 120) {
        return {
            label: "Urgent",
            className: "red"
        };
    }

    if (floor >= 80) {
        return {
            label: "Plannen",
            className: "orange"
        };
    }

    return {
        label: "Normaal",
        className: "green"
    };
}


function countAlerts(list) {

    return Object.entries(
        list.streams || {}
    ).reduce(
        (total, [id, value]) => {

            const stream = getStream(id);

            if (!stream) {
                return total;
            }

            const status =
                statusForStream(
                    stream,
                    value
                );

            return total +
                (
                    status.className !== "green"
                        ? 1
                        : 0
                );
        },
        0
    );
}


/* =========================================================
   MELDING
========================================================= */

function toastMessage(message) {

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(
        toastMessage.timer
    );

    toastMessage.timer = setTimeout(
        () => {
            toast.classList.remove("show");
        },
        2800
    );
}


/* =========================================================
   RENDER
========================================================= */

function render() {

    document
        .querySelectorAll(".view-btn")
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.dataset.view === state.view
            );

        });


    if (state.view === "planner") {

        renderPlanner();

    } else if (state.page === "form") {

        renderForm();

    } else {

        renderTerrainHome();

    }

    bindEvents();
}


/* =========================================================
   STARTPAGINA VOORRAAD
========================================================= */

function renderTerrainHome() {

    const lists = getLists();

    const today = findTodayList();

    app.innerHTML = `

        <div class="page-head">

            <div>

                <h2>Voorraad</h2>

                <p>
                    Overzicht van de dagelijkse voorraadlijsten
                    · Locatie Uden
                </p>

            </div>

        </div>


        <section class="hero-action">

            <div>

                <h3>Dagelijkse voorraad</h3>

                <p>
                    Maak iedere ochtend één voorraadlijst
                    en stuur deze naar de planning.
                </p>

            </div>


            <button
                class="btn primary large"
                id="newListBtn">

                + Nieuwe voorraadlijst maken

            </button>

        </section>


        <h3 class="section-title">
            Recente voorraadlijsten
        </h3>


        <section class="list-grid">

            ${lists.map(list => `

                <article class="list-card">

                    <div class="list-card-top">

                        <div>

                            <div class="list-date">
                                ${formatDate(list.date)}
                            </div>

                            <div class="list-meta">

                                Ingevuld om
                                ${list.createdAt}

                                <br>

                                ${
                                    list.updatedAt !== list.createdAt
                                    ?
                                    `Laatst gewijzigd om ${list.updatedAt}`
                                    :
                                    "Geen wijzigingen"
                                }

                            </div>

                        </div>


                        <span class="status-pill">
                            ✓ Verstuurd
                        </span>

                    </div>


                    <div class="card-actions">

                        <button
                            class="btn secondary view-list"
                            data-id="${list.id}">

                            Bekijken

                        </button>


                        <button
                            class="btn primary edit-list"
                            data-id="${list.id}">

                            Bewerken

                        </button>

                    </div>

                </article>

            `).join("")}

        </section>
    `;
}


/* =========================================================
   NIEUWE LEGE LIJST
========================================================= */

function emptyDraft() {

    const streams = {};

    allStreams.forEach(stream => {

        streams[stream.id] = {

            floor: 0,

            full3040: 0

        };

    });


    return {

        date: dateKey(),

        location: "Uden",

        streams: streams,

        note: ""

    };
}


/* =========================================================
   FORMULIER
========================================================= */

function renderForm() {

    if (!state.draft) {

        state.draft =
            emptyDraft();

    }

    const d =
        state.draft;

    const editing =
        Boolean(state.editingId);


    app.innerHTML = `

        <div class="form-shell">


            <button
                class="back-btn"
                id="backHome">

                ← Terug naar overzicht

            </button>


            <div class="form-header">

                <h2>

                    ${
                        editing
                        ?
                        "Voorraadlijst bewerken"
                        :
                        "Nieuwe voorraadlijst"
                    }

                </h2>


                <p>

                    ${formatDate(d.date)}
                    ·
                    ${d.location}

                </p>

            </div>


            <div class="form-body">


                <section class="stream-section">

                    <h3>
                        Voorraad per afvalstroom
                    </h3>


                    <p
                        style="
                        color:#6d7882;
                        font-size:13px;
                        margin-bottom:16px;
                        ">

                        Vul per afvalstroom de voorraad
                        op de vloer en het aantal volle
                        30/40 m³ bakken in.

                    </p>


                    <div class="stream-list">

                        ${allStreams
                            .map(
                                stream =>
                                    renderBulkStream(
                                        stream,
                                        d.streams[stream.id]
                                    )
                            )
                            .join("")
                        }

                    </div>

                </section>


                <section class="stream-section">

                    <h3>
                        Opmerking
                    </h3>


                    <textarea
                        id="noteInput"
                        placeholder="Bijvoorbeeld: extra voorraad ontstaan na levering..."
                    >${escapeHtml(d.note || "")}</textarea>

                </section>


                <div class="form-footer">

                    <button
                        class="btn primary large"
                        id="submitListBtn">

                        ✓ Voorraadlijst
                        ${
                            editing
                            ?
                            "opnieuw versturen"
                            :
                            "versturen"
                        }

                    </button>

                </div>


            </div>

        </div>

    `;
}


/* =========================================================
   AFVALSTROOM INVOER
========================================================= */

function renderBulkStream(
    stream,
    value = {}
) {

    return `

        <div
            class="stream-row"
            data-stream="${stream.id}"
        >


            <div class="stream-main">


                <div>

                    <div class="stream-name">

                        ${stream.name}

                    </div>


                    <span class="stream-type">

                        Voorraad op terrein

                    </span>

                </div>


                <div class="fields">


                    <!-- OP VLOER -->

                    <div class="field-group">

                        <label>
                            Op vloer
                        </label>


                        <div class="number-control">


                            <button
                                class="step minus"
                                data-id="${stream.id}"
                                data-field="floor">

                                −

                            </button>


                            <input
                                class="number-input stream-input"
                                data-id="${stream.id}"
                                data-field="floor"
                                type="number"
                                min="0"
                                step="1"
                                value="${Number(value.floor || 0)}"
                            >


                            <button
                                class="step plus"
                                data-id="${stream.id}"
                                data-field="floor">

                                +

                            </button>


                        </div>


                        <span class="unit">
                            m³
                        </span>

                    </div>


                    <!-- 30/40 M3 VOL -->

                    <div class="field-group">

                        <label>
                            30/40 m³ vol
                        </label>


                        <div class="number-control">


                            <button
                                class="step minus"
                                data-id="${stream.id}"
                                data-field="full3040">

                                −

                            </button>


                            <input
                                class="number-input stream-input"
                                data-id="${stream.id}"
                                data-field="full3040"
                                type="number"
                                min="0"
                                step="1"
                                value="${Number(value.full3040 || 0)}"
                            >


                            <button
                                class="step plus"
                                data-id="${stream.id}"
                                data-field="full3040">

                                +

                            </button>


                        </div>


                        <span class="unit">
                            stuks
                        </span>

                    </div>


                </div>


            </div>


        </div>

    `;
}


/* =========================================================
   OUDE CONTAINER FUNCTIES
   Niet meer nodig, maar behouden zodat
   bestaande HTML geen fouten veroorzaakt.
========================================================= */

function renderContainerStream() {

    return "";

}


function renderSelectedOtherStreams() {

    return "";

}


function addOtherStream() {

    toastMessage(
        "De afvalstromen staan al in de vaste voorraadlijst."
    );

}


/* =========================================================
   WAARDE BIJWERKEN
========================================================= */

function updateDraftField(
    id,
    field,
    value
) {

    if (!state.draft.streams[id]) {

        state.draft.streams[id] = {};

    }


    state.draft.streams[id][field] =
        Math.max(
            0,
            Number(value) || 0
        );

}


function changeNumber(
    id,
    field,
    amount
) {

    const current =
        Number(
            state.draft.streams[id]?.[field] || 0
        );


    updateDraftField(
        id,
        field,
        current + amount
    );


    render();

}


/* =========================================================
   OPSLAAN VOORRAADLIJST
========================================================= */

function submitDraft() {

    const lists =
        getLists();


    const existingIndex =
        lists.findIndex(
            list =>
                list.id === state.editingId
        );


    const now =
        new Date();


    const existing =
        existingIndex >= 0
            ?
            lists[existingIndex]
            :
            null;


    const list = {

        id:
            existing?.id ||
            `list-${Date.now()}`,

        date:
            state.draft.date,

        location:
            state.draft.location,

        createdAt:
            existing?.createdAt ||
            formatTime(now),

        updatedAt:
            formatTime(now),

        status:
            "verstuurd",

        note:
            state.draft.note || "",

        streams:
            state.draft.streams

    };


    if (existingIndex >= 0) {

        lists[existingIndex] =
            list;

    } else {

        lists.push(list);

    }


    saveLists(lists);


    state.page =
        "home";

    state.editingId =
        null;

    state.draft =
        null;


    render();


    toastMessage(
        `Voorraadlijst van ${formatDate(list.date)} is verstuurd.`
    );

}


/* =========================================================
   NIEUWE LIJST
========================================================= */

function startNewList() {

    const existing =
        findTodayList();


    if (existing) {

        document.getElementById(
            "confirmText"
        ).textContent =

            `Er is al een voorraadlijst voor ${formatDate(existing.date)}. Je kunt de bestaande lijst bewerken.`;

        editExistingBtn.dataset.id =
            existing.id;

        confirmModal.classList.remove(
            "hidden"
        );

        return;

    }


    state.page =
        "form";

    state.editingId =
        null;

    state.draft =
        emptyDraft();


    render();

}


/* =========================================================
   BEWERKEN
========================================================= */

function editList(id) {

    const list =
        getLists().find(
            x => x.id === id
        );


    if (!list) {
        return;
    }


    state.page =
        "form";

    state.editingId =
        id;

    state.draft =
        JSON.parse(
            JSON.stringify(list)
        );


    // Oude lijsten automatisch aanvullen
    // met de nieuwe velden.
    allStreams.forEach(stream => {

        if (!state.draft.streams[stream.id]) {

            state.draft.streams[stream.id] = {

                floor: 0,

                full3040: 0

            };

        }

        if (
            state.draft.streams[stream.id].floor === undefined
        ) {

            state.draft.streams[stream.id].floor = 0;

        }

        if (
            state.draft.streams[stream.id].full3040 === undefined
        ) {

            state.draft.streams[stream.id].full3040 = 0;

        }

    });


    render();

}


/* =========================================================
   BEKIJKEN
========================================================= */

function viewList(id) {

    const list =
        getLists().find(
            x => x.id === id
        );


    if (!list) {
        return;
    }


    state.page =
        "form";

    state.editingId =
        id;

    state.draft =
        JSON.parse(
            JSON.stringify(list)
        );


    allStreams.forEach(stream => {

        if (!state.draft.streams[stream.id]) {

            state.draft.streams[stream.id] = {

                floor: 0,

                full3040: 0

            };

        }

    });


    render();


    toastMessage(
        "Je bekijkt de voorraadlijst. De lijst kan ook worden bewerkt."
    );

}


/* =========================================================
   PLANNER
========================================================= */

function renderPlanner() {

    const lists =
        getLists();


    const latest =
        lists[0];


    if (!latest) {

        app.innerHTML = `

            <div class="empty">

                <h3>
                    Nog geen voorraadlijsten
                </h3>

                <p>
                    Wanneer de terreinmedewerker
                    een lijst verstuurt, verschijnt
                    deze hier.
                </p>

            </div>

        `;

        return;

    }


    const entries =
        allStreams.map(
            stream => ({

                stream,

                value:
                    latest.streams?.[stream.id] ||
                    {
                        floor: 0,
                        full3040: 0
                    }

            })
        );


    const totalFull =
        entries.reduce(
            (sum, x) =>
                sum +
                Number(
                    x.value.full3040 || 0
                ),
            0
        );


    const totalFloor =
        entries.reduce(
            (sum, x) =>
                sum +
                Number(
                    x.value.floor || 0
                ),
            0
        );


    app.innerHTML = `

        <div class="page-head">

            <div>

                <h2>
                    Voorraadplanning
                </h2>

                <p>
                    Actueel overzicht voor de planner
                    · ${latest.location}
                </p>

            </div>


            <button
                class="btn secondary"
                id="refreshPlanner">

                ↻ Vernieuwen

            </button>

        </div>


        <section class="planner-summary">


            <div class="summary-card">

                <small>
                    Voorraadlijst
                </small>

                <div class="number">

                    ${formatDate(latest.date)}

                </div>

            </div>


            <div class="summary-card">

                <small>
                    Afvalstromen
                </small>

                <div class="number">

                    ${entries.length}

                </div>

            </div>


            <div class="summary-card">

                <small>
                    Volle 30/40 m³
                </small>

                <div class="number">

                    ${totalFull}

                </div>

            </div>


            <div class="summary-card">

                <small>
                    Totaal vloer
                </small>

                <div class="number">

                    ${totalFloor} m³

                </div>

            </div>


        </section>


        <section class="planner-table-wrap">


            <div class="table-head">

                <div>

                    <h3>
                        Actuele voorraad
                    </h3>

                    <p>

                        Ingevuld om
                        ${latest.createdAt}

                        ${
                            latest.updatedAt !== latest.createdAt
                            ?
                            ` · laatst gewijzigd ${latest.updatedAt}`
                            :
                            ""
                        }

                    </p>

                </div>


                <span class="status-pill">

                    ✓ Voorraad ontvangen

                </span>

            </div>


            <table>


                <thead>

                    <tr>

                        <th>
                            Afvalstroom
                        </th>

                        <th>
                            Op vloer
                        </th>

                        <th>
                            30/40 m³ vol
                        </th>

                    </tr>

                </thead>


                <tbody>


                    ${entries.map(
                        ({ stream, value }) => `

                        <tr>

                            <td>
                                <strong>
                                    ${stream.name}
                                </strong>
                            </td>


                            <td>

                                ${Number(
                                    value.floor || 0
                                )} m³

                            </td>


                            <td>

                                ${Number(
                                    value.full3040 || 0
                                )}

                            </td>

                        </tr>

                    `).join("")}


                </tbody>


            </table>


        </section>


        ${
            latest.note
            ?
            `

            <section
                class="container-alert"
                style="
                    margin-top:18px;
                    background:white;
                    border-color:var(--border);
                "
            >

                <strong
                    style="color:var(--navy);"
                >

                    Opmerking terrein

                </strong>


                <div
                    style="
                        margin-top:6px;
                        color:var(--muted);
                    "
                >

                    ${escapeHtml(
                        latest.note
                    )}

                </div>

            </section>

            `
            :
            ""
        }

    `;

}


/* =========================================================
   HTML VEILIG MAKEN
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {


    /* VIEW KNOPPEN */

    document
        .querySelectorAll(".view-btn")
        .forEach(btn => {

            btn.onclick = () => {

                state.view =
                    btn.dataset.view;

                state.page =
                    "home";

                state.editingId =
                    null;

                state.draft =
                    null;

                render();

            };

        });


    /* NIEUWE LIJST */

    const newBtn =
        document.getElementById(
            "newListBtn"
        );


    if (newBtn) {

        newBtn.onclick =
            startNewList;

    }


    /* TERUG */

    const backHome =
        document.getElementById(
            "backHome"
        );


    if (backHome) {

        backHome.onclick = () => {

            state.page =
                "home";

            state.editingId =
                null;

            state.draft =
                null;

            render();

        };

    }


    /* BEWERKEN */

    document
        .querySelectorAll(".edit-list")
        .forEach(btn => {

            btn.onclick = () => {

                editList(
                    btn.dataset.id
                );

            };

        });


    /* BEKIJKEN */

    document
        .querySelectorAll(".view-list")
        .forEach(btn => {

            btn.onclick = () => {

                viewList(
                    btn.dataset.id
                );

            };

        });


    /* PLUS */

    document
        .querySelectorAll(".plus")
        .forEach(btn => {

            btn.onclick = () => {

                changeNumber(
                    btn.dataset.id,
                    btn.dataset.field,
                    1
                );

            };

        });


    /* MIN */

    document
        .querySelectorAll(".minus")
        .forEach(btn => {

            btn.onclick = () => {

                changeNumber(
                    btn.dataset.id,
                    btn.dataset.field,
                    -1
                );

            };

        });


    /* INPUT */

    document
        .querySelectorAll(".stream-input")
        .forEach(input => {

            input.onchange = () => {

                updateDraftField(
                    input.dataset.id,
                    input.dataset.field,
                    input.value
                );

            };

        });


    /* OPMERKING */

    const note =
        document.getElementById(
            "noteInput"
        );


    if (note) {

        note.oninput = () => {

            state.draft.note =
                note.value;

        };

    }


    /* VERSTUREN */

    const submit =
        document.getElementById(
            "submitListBtn"
        );


    if (submit) {

        submit.onclick =
            submitDraft;

    }


    /* PLANNER VERNIEUWEN */

    const refresh =
        document.getElementById(
            "refreshPlanner"
        );


    if (refresh) {

        refresh.onclick = () => {

            render();

            toastMessage(
                "Planning vernieuwd."
            );

        };

    }

}


/* =========================================================
   MODAL
========================================================= */

document
    .querySelectorAll(
        "[data-close-modal]"
    )
    .forEach(btn => {

        btn.onclick = () => {

            confirmModal.classList.add(
                "hidden"
            );

        };

    });


editExistingBtn.onclick = () => {

    const id =
        editExistingBtn.dataset.id;


    confirmModal.classList.add(
        "hidden"
    );


    editList(id);

};


confirmModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            confirmModal
        ) {

            confirmModal.classList.add(
                "hidden"
            );

        }

    }
);


/* =========================================================
   START
========================================================= */

render();