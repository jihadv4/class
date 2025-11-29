// Data structure and initialization
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
let currentDay = "Sunday"
let defaultSchedules = {}
let tempSchedules = {}
let editingId = null
let editingIsTemp = false
let customOptions = {
  courses: [], // Now stores objects with name and code
  instructors: [],
  rooms: [],
  buildings: [],
  removedDefaults: { courses: [], instructors: [], rooms: [], buildings: [] },
}
let customFormatTemplate = null

// Initialize app
function init() {
  loadSchedules()
  loadCustomOptions()
  loadCustomFormatTemplate()
  populateDropdowns()
  setupEventListeners()
  // Restore last selected tab from localStorage if available
  const storedDay = localStorage.getItem("activeDay")
  if (storedDay && DAYS.includes(storedDay)) {
    currentDay = storedDay
    // Update UI active class
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
    const btn = Array.from(document.querySelectorAll(".tab-btn")).find((b) => b.dataset.day === currentDay)
    if (btn) {
      btn.classList.add("active")
    }
  }
  // Ensure aria-selected is correct on init
  document.querySelectorAll('.tab-btn').forEach((b) => b.setAttribute('aria-selected', b.classList.contains('active') ? 'true' : 'false'))
  // Set the date input to the next occurrence of the currently selected day by default
  setDateInputToDay(currentDay)
  // Restore theme from localStorage
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme === 'dark') {
    document.body.classList.add('dark-mode')
    const themeIcon = document.getElementById('themeIcon')
    if (themeIcon) themeIcon.textContent = '☀️'
    const toggle = document.getElementById('themeToggleBtn')
    if (toggle) toggle.setAttribute('aria-pressed', 'true')
  }
  renderSchedule()
  // Footer year and credit
  const footerYearEl = document.getElementById('footerYear')
  if (footerYearEl) footerYearEl.textContent = new Date().getFullYear()
  const footerCredit = document.getElementById('footerCredit')
  if (footerCredit) footerCredit.setAttribute('href', '#')
}

// Load schedules from localStorage
function loadSchedules() {
  const stored = localStorage.getItem("defaultSchedules")
  if (stored) {
    defaultSchedules = JSON.parse(stored)
  } else {
    DAYS.forEach((day) => {
      defaultSchedules[day] = []
    })
    saveDefaultSchedules()
  }

  const tempStored = localStorage.getItem("tempSchedules")
  if (tempStored) {
    tempSchedules = JSON.parse(tempStored)
  } else {
    DAYS.forEach((day) => {
      tempSchedules[day] = []
    })
  }
}

function loadCustomOptions() {
  const stored = localStorage.getItem("customOptions")
  if (stored) {
    customOptions = JSON.parse(stored)
    // Backwards compatibility: add removedDefaults if it's missing
    if (!customOptions.removedDefaults) {
      customOptions.removedDefaults = { courses: [], instructors: [], rooms: [], buildings: [] }
    } else {
      // Ensure each subarray exists
      customOptions.removedDefaults.courses = customOptions.removedDefaults.courses || []
      customOptions.removedDefaults.instructors = customOptions.removedDefaults.instructors || []
      customOptions.removedDefaults.rooms = customOptions.removedDefaults.rooms || []
      customOptions.removedDefaults.buildings = customOptions.removedDefaults.buildings || []
    }
  }
}

function loadCustomFormatTemplate() {
  const stored = localStorage.getItem("customFormatTemplate")
  if (stored) {
    try {
      customFormatTemplate = JSON.parse(stored)
    } catch {
      customFormatTemplate = DEFAULT_FORMAT_TEMPLATE
    }
  } else {
    customFormatTemplate = DEFAULT_FORMAT_TEMPLATE
  }
}

function saveCustomFormatTemplate(template) {
  customFormatTemplate = template
  localStorage.setItem("customFormatTemplate", JSON.stringify(template))
}

function saveCustomOptions() {
  localStorage.setItem("customOptions", JSON.stringify(customOptions))
}

// Save default schedules
function saveDefaultSchedules() {
  localStorage.setItem("defaultSchedules", JSON.stringify(defaultSchedules))
}

// Save temp schedules
function saveTempSchedules() {
  localStorage.setItem("tempSchedules", JSON.stringify(tempSchedules))
}

// Get current schedule (temp overrides default)
function getCurrentSchedule(day) {
  // Merge default and temporary schedules for the given day so temporary classes
  // do not hide or replace default classes in the UI. Preserve order by startTime
  const defaults = defaultSchedules[day] || []
  const temps = tempSchedules[day] || []
  return [...defaults, ...temps]
}

function populateDropdowns() {
  const defaultCourses = DEFAULT_COURSES
  const defaultInstructors = DEFAULT_INSTRUCTORS
  const defaultRooms = DEFAULT_ROOMS
  const defaultBuildings = DEFAULT_BUILDINGS

  const courseSelect = document.getElementById("course")
  const courseCodeSelect = document.getElementById("courseCode")
  const instructorSelect = document.getElementById("instructor")
  const roomSelect = document.getElementById("room")
  const buildingSelect = document.getElementById("building")

  courseSelect.innerHTML = '<option value="">Select a course...</option>'
  // Filter out default courses that have been removed by the user
  const filteredDefaultCourses = defaultCourses.filter((c) => !customOptions.removedDefaults?.courses?.includes(c.code))
  const allCourses = [...filteredDefaultCourses, ...customOptions.courses]
  const uniqueCourses = Array.from(new Map(allCourses.map((c) => [c.name, c])).values())
  uniqueCourses.forEach((course) => {
    const option = document.createElement("option")
    option.value = course.name
    option.textContent = course.name
    courseSelect.appendChild(option)
  })

  courseCodeSelect.innerHTML = '<option value="">Select a course code...</option>'
  const uniqueCodes = Array.from(new Map(allCourses.map((c) => [c.code, c])).values())
  uniqueCodes.forEach((course) => {
    const option = document.createElement("option")
    option.value = course.code
    option.textContent = course.code
    courseCodeSelect.appendChild(option)
  })

  // Clear and repopulate instructor dropdown
  instructorSelect.innerHTML = '<option value="">Select an instructor...</option>'
  const filteredDefaultInstructors = defaultInstructors.filter((i) => !customOptions.removedDefaults?.instructors?.includes(i))
  const allInstructors = [...new Set([...filteredDefaultInstructors, ...customOptions.instructors])]
  allInstructors.forEach((instructor) => {
    const option = document.createElement("option")
    option.value = instructor
    option.textContent = instructor
    instructorSelect.appendChild(option)
  })

  // Clear and repopulate room dropdown
  roomSelect.innerHTML = '<option value="">Select a room...</option>'
  const filteredDefaultRooms = defaultRooms.filter((r) => !customOptions.removedDefaults?.rooms?.includes(r))
  const allRooms = [...new Set([...filteredDefaultRooms, ...customOptions.rooms])]
  allRooms.forEach((room) => {
    const option = document.createElement("option")
    option.value = room
    option.textContent = room
    roomSelect.appendChild(option)
  })

  // Clear and repopulate building dropdown
  buildingSelect.innerHTML = '<option value="">Select a building...</option>'
  const filteredDefaultBuildings = defaultBuildings.filter((b) => !customOptions.removedDefaults?.buildings?.includes(b))
  const allBuildings = [...new Set([...filteredDefaultBuildings, ...customOptions.buildings])]
  allBuildings.forEach((building) => {
    const option = document.createElement("option")
    option.value = building
    option.textContent = building
    buildingSelect.appendChild(option)
  })
  // ...existing code...
}

function renderOptionsLists() {
  const defaultCourses = DEFAULT_COURSES
  const defaultInstructors = DEFAULT_INSTRUCTORS
  const defaultRooms = DEFAULT_ROOMS
  const defaultBuildings = DEFAULT_BUILDINGS

  const courseListEl = document.getElementById("courseList")
  courseListEl.innerHTML = ""
  const allCourses = [...defaultCourses, ...customOptions.courses]
  const uniqueCourses = Array.from(new Map(allCourses.map((c) => [c.code, c])).values())
  uniqueCourses.forEach((course) => {
    const isCustom = !defaultCourses.some((c) => c.code === course.code)
    const defaultRemoved = !isCustom && customOptions.removedDefaults?.courses?.includes(course.code)
    const div = document.createElement("div")
    div.className = "option-item"
    div.innerHTML = `
      <span>${course.name} (${course.code})${isCustom ? ' <span class="custom-badge">Custom</span>' : ""}</span>
      <div class="option-actions">
        ${isCustom ? `<button class="btn btn-small" onclick="openEditOptionModal('courses', '${course.code}', '${course.name}', '${course.code}')">Edit</button>` : ""}
        ${isCustom ? `<button class="btn btn-small btn-danger" onclick="removeOption('courses', '${course.code}')">Remove</button>` : ""}
        ${!isCustom && !defaultRemoved ? `<button class="btn btn-small btn-danger" onclick="removeOption('courses', '${course.code}')">Remove</button>` : ""}
        ${!isCustom && defaultRemoved ? `<button class="btn btn-small" onclick="restoreDefaultOption('courses', '${course.code}')">Restore</button>` : ""}
      </div>
    `
    courseListEl.appendChild(div)
  })

  const renderList = (listId, items, defaultItems, type) => {
    const listEl = document.getElementById(listId)
    listEl.innerHTML = ""
    const allItems = [...new Set([...defaultItems, ...items])]
    allItems.forEach((item) => {
      const isCustom = !defaultItems.includes(item)
      const defaultRemoved = !isCustom && customOptions.removedDefaults?.[type]?.includes(item)
      const div = document.createElement("div")
      div.className = "option-item"
      div.innerHTML = `
        <span>${item}${isCustom ? ' <span class="custom-badge">Custom</span>' : ""}</span>
        <div class="option-actions">
          ${isCustom ? `<button class="btn btn-small" onclick="openEditOptionModal('${type}', '${item}', '${item}')">Edit</button>` : ""}
          ${isCustom ? `<button class="btn btn-small btn-danger" onclick="removeOption('${type}', '${item}')">Remove</button>` : ""}
          ${!isCustom && !defaultRemoved ? `<button class="btn btn-small btn-danger" onclick="removeOption('${type}', '${item}')">Remove</button>` : ""}
          ${!isCustom && defaultRemoved ? `<button class="btn btn-small" onclick="restoreDefaultOption('${type}', '${item}')">Restore</button>` : ""}
        </div>
      `
      listEl.appendChild(div)
    })
  }

  renderList("instructorList", customOptions.instructors, defaultInstructors, "instructors")
  renderList("roomList", customOptions.rooms, defaultRooms, "rooms")
  renderList("buildingList", customOptions.buildings, defaultBuildings, "buildings")
}

let editingOptionData = null

function openEditOptionModal(type, oldValue, displayName, code = null) {
  editingOptionData = { type, oldValue, code }
  document.getElementById("editOptionValue").value = displayName

  const codeGroup = document.getElementById("editOptionCodeGroup")
  if (type === "courses") {
    codeGroup.style.display = "block"
    document.getElementById("editOptionCode").value = code || ""
  } else {
    codeGroup.style.display = "none"
  }

  openModal(document.getElementById("editOptionModal"), '#editOptionValue')
}

function saveEditOption() {
  if (!editingOptionData) return

  const newValue = document.getElementById("editOptionValue").value.trim()
  if (!newValue) {
    alert("Please enter a value")
    return
  }

  const { type, oldValue, code } = editingOptionData

  if (type === "courses") {
    const newCode = document.getElementById("editOptionCode").value.trim()
    if (!newCode) {
      alert("Please enter a code")
      return
    }

    const courseIndex = customOptions.courses.findIndex((c) => c.code === oldValue)
    if (courseIndex > -1) {
      customOptions.courses[courseIndex] = { name: newValue, code: newCode }
    }
  } else {
    const itemIndex = customOptions[type].indexOf(oldValue)
    if (itemIndex > -1) {
      customOptions[type][itemIndex] = newValue
    }
  }

  saveCustomOptions()
  populateDropdowns()
  renderOptionsLists()
  closeModal(document.getElementById("editOptionModal"))
  editingOptionData = null
}

function addOption(type, name, code) {
  if (type === "courses") {
    if (!name.trim() || !code.trim()) {
      alert("Please enter both course name and code")
      return
    }
    if (!customOptions.courses.some((c) => c.code === code)) {
      customOptions.courses.push({ name, code })
      // If this code was previously marked as removed from defaults, restore it
      if (customOptions.removedDefaults?.courses?.includes(code)) {
        customOptions.removedDefaults.courses = customOptions.removedDefaults.courses.filter((c) => c !== code)
      }
      saveCustomOptions()
      populateDropdowns()
      renderOptionsLists()
    }
  } else {
    if (!name.trim()) {
      alert("Please enter a value")
      return
    }
    if (!customOptions[type].includes(name)) {
      customOptions[type].push(name)
      // If this name was previously removed from defaults, restore it
      if (customOptions.removedDefaults?.[type]?.includes(name)) {
        customOptions.removedDefaults[type] = customOptions.removedDefaults[type].filter((i) => i !== name)
      }
      saveCustomOptions()
      populateDropdowns()
      renderOptionsLists()
    }
  }
}

function removeOption(type, value) {
  if (type === "courses") {
    // If it's a custom course, remove from customOptions
    const customIndex = customOptions.courses.findIndex((c) => c.code === value)
    if (customIndex > -1) {
      customOptions.courses.splice(customIndex, 1)
    } else {
      // Otherwise, it's a default course: mark as removed
      if (!customOptions.removedDefaults) customOptions.removedDefaults = { courses: [], instructors: [], rooms: [], buildings: [] }
      if (!customOptions.removedDefaults.courses.includes(value)) {
        customOptions.removedDefaults.courses.push(value)
      }
    }
  } else {
    // For non-courses, check custom list first
    if (customOptions[type] && customOptions[type].includes(value)) {
      customOptions[type] = customOptions[type].filter((item) => item !== value)
    } else {
      if (!customOptions.removedDefaults) customOptions.removedDefaults = { courses: [], instructors: [], rooms: [], buildings: [] }
      if (!customOptions.removedDefaults[type].includes(value)) {
        customOptions.removedDefaults[type].push(value)
      }
    }
  }
  saveCustomOptions()
  populateDropdowns()
  renderOptionsLists()
}

function restoreDefaultOption(type, value) {
  if (!customOptions.removedDefaults) return
  if (type === 'courses') {
    customOptions.removedDefaults.courses = customOptions.removedDefaults.courses.filter((c) => c !== value)
  } else {
    customOptions.removedDefaults[type] = customOptions.removedDefaults[type].filter((item) => item !== value)
  }
  saveCustomOptions()
  populateDropdowns()
  renderOptionsLists()
}

// Setup event listeners
function setupEventListeners() {
  // Modal handlers are defined globally: openModal / closeModal
  document.getElementById("settingsBtn").addEventListener("click", () => {
    openModal(document.getElementById("settingsModal"), '#newCourseName')
    renderOptionsLists()
  })

  document.getElementById("formatEditorBtn").addEventListener("click", () => {
    document.getElementById("formatDayHeader").value =
      customFormatTemplate?.dayHeader || DEFAULT_FORMAT_TEMPLATE.dayHeader
    document.getElementById("formatClassLine").value =
      customFormatTemplate?.classLine || DEFAULT_FORMAT_TEMPLATE.classLine
    generateFormatPreview()
    openModal(document.getElementById("formatEditorModal"), '#formatDayHeader')
  })

  document.getElementById("closeSettingsBtn").addEventListener("click", (e) => {
    closeModal(document.getElementById("settingsModal"), document.getElementById('settingsBtn'))
  })

  document.getElementById("closeFormatEditorBtn").addEventListener("click", () => {
    closeModal(document.getElementById("formatEditorModal"), document.getElementById('formatEditorBtn'))
  })

  document.getElementById("closeFormatEditorBtnBottom").addEventListener("click", () => {
    closeModal(document.getElementById("formatEditorModal"), document.getElementById('formatEditorBtn'))
  })

  document.getElementById("formatDayHeader").addEventListener("input", generateFormatPreview)
  document.getElementById("formatClassLine").addEventListener("input", generateFormatPreview)

  document.getElementById("saveFormatTemplateBtn").addEventListener("click", () => {
    const dayHeader = document.getElementById("formatDayHeader").value
    const classLine = document.getElementById("formatClassLine").value

    if (!dayHeader.trim() || !classLine.trim()) {
      alert("Please enter both day header and class line templates")
      return
    }

    saveCustomFormatTemplate({ dayHeader, classLine })
    alert("Format saved successfully!")
    closeModal(document.getElementById("formatEditorModal"), document.getElementById('formatEditorBtn'))
  })

  document.getElementById("resetFormatBtn").addEventListener("click", () => {
    if (confirm("Reset to default format?")) {
      customFormatTemplate = DEFAULT_FORMAT_TEMPLATE
      localStorage.removeItem("customFormatTemplate")
      document.getElementById("formatDayHeader").value = DEFAULT_FORMAT_TEMPLATE.dayHeader
      document.getElementById("formatClassLine").value = DEFAULT_FORMAT_TEMPLATE.classLine
      generateFormatPreview()
      alert("Format reset to default!")
    }
  })

  document.getElementById("addCourseBtn").addEventListener("click", () => {
    const name = document.getElementById("newCourseName").value
    const code = document.getElementById("newCourseCode").value
    addOption("courses", name, code)
    document.getElementById("newCourseName").value = ""
    document.getElementById("newCourseCode").value = ""
  })

  document.getElementById("addInstructorBtn").addEventListener("click", () => {
    const value = document.getElementById("newInstructor").value
    addOption("instructors", value)
    document.getElementById("newInstructor").value = ""
  })

  document.getElementById("addRoomBtn").addEventListener("click", () => {
    const value = document.getElementById("newRoom").value
    addOption("rooms", value)
    document.getElementById("newRoom").value = ""
  })

  document.getElementById("addBuildingBtn").addEventListener("click", () => {
    const value = document.getElementById("newBuilding").value
    addOption("buildings", value)
    document.getElementById("newBuilding").value = ""
  })

  // Close modal when clicking outside
  document.getElementById("settingsModal").addEventListener("click", (e) => {
    if (e.target.id === "settingsModal") {
      closeModal(document.getElementById("settingsModal"), document.getElementById('settingsBtn'))
    }
  })

  document.getElementById("closeTextEditorBtn").addEventListener("click", () => {
    closeModal(document.getElementById("textEditorModal"), document.getElementById('copyBtn'))
  })

  document.getElementById("closeTextEditorBtnBottom").addEventListener("click", () => {
    closeModal(document.getElementById("textEditorModal"), document.getElementById('copyBtn'))
  })

  document.getElementById("copyTextBtn").addEventListener("click", () => {
    const text = document.getElementById("scheduleText").value
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Schedule copied to clipboard!")
      })
      .catch(() => {
        alert("Failed to copy to clipboard")
      })
  })

  document.getElementById("saveFormatBtn").addEventListener("click", () => {
    const text = document.getElementById("scheduleText").value
    saveCustomFormatTemplate(text)
    alert("Format saved as default! Future copies will use this format.")
  })

  document.getElementById("textEditorModal").addEventListener("click", (e) => {
    if (e.target.id === "textEditorModal") {
      closeModal(document.getElementById("textEditorModal"), document.getElementById('copyBtn'))
    }
  })

  // Tab buttons
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    // Accessibility: mark each button as a tab and set aria-selected
    btn.setAttribute('role', 'tab')
    btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false')
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"))
      e.target.classList.add("active")
      currentDay = e.target.dataset.day
      // Persist selected day to localStorage
      localStorage.setItem('activeDay', currentDay)
      // Update aria-selected states
      document.querySelectorAll('.tab-btn').forEach((b) => b.setAttribute('aria-selected', b.classList.contains('active') ? 'true' : 'false'))
      cancelEdit()
      // Update the date input to the next occurrence of the selected day (unless tempOnly is checked)
      setDateInputToDay(currentDay)
      // Hide any date validation message when switching tabs
      hideDateError()
      renderSchedule()
    })
  })

  // Keyboard navigation for tabs (left/right/home/end + Enter/Space to select)
  const tabsContainer = document.querySelector('.tabs')
  if (tabsContainer) {
    tabsContainer.addEventListener('keydown', (e) => {
      const tabs = Array.from(document.querySelectorAll('.tab-btn'))
      const active = document.activeElement
      const idx = tabs.indexOf(active)
      if (idx === -1) return
      if (e.key === 'ArrowRight') {
        const next = tabs[(idx + 1) % tabs.length]
        next.focus()
        e.preventDefault()
      } else if (e.key === 'ArrowLeft') {
        const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
        prev.focus()
        e.preventDefault()
      } else if (e.key === 'Home') {
        tabs[0].focus()
        e.preventDefault()
      } else if (e.key === 'End') {
        tabs[tabs.length - 1].focus()
        e.preventDefault()
      } else if (e.key === 'Enter' || e.key === ' ') {
        active.click()
        e.preventDefault()
      }
    })
  }

  // Form submission
  document.getElementById("classForm").addEventListener("submit", handleAddClass)

  document.getElementById("copyBtn").addEventListener("click", handleCopy)

  // Reset button
  document.getElementById("resetBtn").addEventListener("click", handleReset)

  document.getElementById("cancelBtn").addEventListener("click", cancelEdit)

  // Theme toggle
  const themeToggle = document.getElementById('themeToggleBtn')
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode')
      if (isDark) {
        localStorage.setItem('theme', 'dark')
        document.getElementById('themeIcon').textContent = '☀️'
        themeToggle.setAttribute('aria-pressed', 'true')
      } else {
        localStorage.setItem('theme', 'light')
        document.getElementById('themeIcon').textContent = '🌙'
        themeToggle.setAttribute('aria-pressed', 'false')
      }
    })
  }

  // When 'Temporary (Today Only)' is toggled, just disable/enable the date input, do not change its value
  const tempOnlyEl = document.getElementById("tempOnly")
  if (tempOnlyEl) {
    tempOnlyEl.addEventListener("change", (e) => {
      const dateInput = document.getElementById("date")
      if (e.target.checked) {
        if (dateInput) dateInput.disabled = true
      } else {
        if (dateInput) dateInput.disabled = false
      }
    })
  }

  // Date input validation: ensure manual selected dates match selected weekday
  const dateInput = document.getElementById('date')
  const dateError = document.getElementById('dateError')
  const fixDateBtn = document.getElementById('fixDateBtn')
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      // If tempOnly is checked, it's always valid (today)
      const isTemp = document.getElementById('tempOnly').checked
      if (isTemp) {
        hideDateError()
        return
      }
      const val = e.target.value
      if (!val) { hideDateError(); return }
      const selected = new Date(val)
      if (Number.isNaN(selected.getTime())) { hideDateError(); return }
      const weekdayName = DAYS[selected.getDay()]
      if (weekdayName !== currentDay) {
        showDateError(`Selected date is a ${weekdayName}, not ${currentDay}.`)
      } else {
        hideDateError()
      }
    })
    dateInput.addEventListener('input', () => { hideDateError(); clearFormError() })
  }
  if (fixDateBtn) {
    fixDateBtn.addEventListener('click', () => {
      setDateInputToDay(currentDay)
      hideDateError()
    })
  }

  // Clear form errors when time inputs change
  const startTimeEl = document.getElementById('startTime')
  const endTimeEl = document.getElementById('endTime')
  if (startTimeEl) startTimeEl.addEventListener('input', () => clearFormError())
  if (endTimeEl) endTimeEl.addEventListener('input', () => clearFormError())

  function showDateError(msg) {
    if (dateError) {
      dateError.textContent = msg
      dateError.style.display = 'block'
    }
    if (fixDateBtn) fixDateBtn.style.display = 'inline-flex'
  }

  function hideDateError() {
    if (dateError) {
      dateError.textContent = ''
      dateError.style.display = 'none'
    }
    if (fixDateBtn) fixDateBtn.style.display = 'none'
  }

  document.getElementById("closeEditOptionBtn").addEventListener("click", () => {
    closeModal(document.getElementById("editOptionModal"))
    editingOptionData = null
  })

  document.getElementById("closeEditOptionBtnBottom").addEventListener("click", () => {
    closeModal(document.getElementById("editOptionModal"))
    editingOptionData = null
  })

  document.getElementById("saveEditOptionBtn").addEventListener("click", saveEditOption)

  document.getElementById("editOptionModal").addEventListener("click", (e) => {
    if (e.target.id === "editOptionModal") {
      closeModal(document.getElementById("editOptionModal"))
      editingOptionData = null
    }
  })
}

function handleEditClass(id, isTemp) {
  const schedule = isTemp ? tempSchedules[currentDay] : defaultSchedules[currentDay]
  const classItem = schedule.find((c) => c.id === id)

  if (!classItem) return

  // Populate form with class data
  document.getElementById("course").value = classItem.course
  document.getElementById("courseCode").value = classItem.courseCode
  document.getElementById("instructor").value = classItem.instructor
  document.getElementById("room").value = classItem.room
  document.getElementById("building").value = classItem.building
  document.getElementById("startTime").value = classItem.startTime
  document.getElementById("endTime").value = classItem.endTime
  document.getElementById("date").value = classItem.date || ""
  document.getElementById("tempOnly").checked = classItem.tempOnly

  // If editing an existing temp-only class, lock the date to the stored value
  const dateInput = document.getElementById("date")
  if (classItem.tempOnly && dateInput) {
    dateInput.disabled = true
  } else if (dateInput) {
    dateInput.disabled = false
  }

  // Set editing state
  editingId = id
  editingIsTemp = isTemp

  // Update UI
  document.getElementById("formTitle").textContent = "Edit Class"
  document.getElementById("submitBtn").textContent = "Update Class"
  document.getElementById("cancelBtn").style.display = "inline-flex"

  // Scroll to form
  document.querySelector(".form-section").scrollIntoView({ behavior: "smooth" })
}

function cancelEdit() {
  editingId = null
  editingIsTemp = false
  document.getElementById("classForm").reset()
  // When cancelling edits, set the date input to the next occurrence of the current tab day and enable
  setDateInputToDay(currentDay)
  const dateInput = document.getElementById("date")
  if (dateInput) dateInput.disabled = false
  document.getElementById("formTitle").textContent = "Add Class"
  document.getElementById("submitBtn").textContent = "Add Class"
  document.getElementById("cancelBtn").style.display = "none"
}

// Utility to format a Date object to a YYYY-MM-DD string for the date input
function formatDateToInputValue(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

// Show/hide form-level errors
function showFormError(msg) {
  const el = document.getElementById('formError')
  if (!el) return
  el.textContent = msg
  el.style.display = 'block'
}

function clearFormError() {
  const el = document.getElementById('formError')
  if (!el) return
  el.textContent = ''
  el.style.display = 'none'
}

// Parse time string 'HH:MM' to minutes
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  if (parts.length !== 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function isValidTimeRange(startTime, endTime) {
  const s = parseTimeToMinutes(startTime)
  const e = parseTimeToMinutes(endTime)
  if (s === null || e === null) return false
  return s < e
}

function isOverlappingWithOther(schedule, startTime, endTime, skipId = null, date = null, ignoreDefaults = false) {
  const s = parseTimeToMinutes(startTime)
  const e = parseTimeToMinutes(endTime)
  for (const item of schedule) {
    if (skipId && item.id === skipId) continue
    // If ignoreDefaults is true, skip items that are weekly defaults (no date)
    if (ignoreDefaults && !item.date) continue
    const itemDate = item.date || ""
    const paramDate = date || ""
    // Determine if this item should be considered based on dates and weekly defaults
    let shouldConsider = false
    if (paramDate === "" && itemDate === "") {
      // both weekly schedules
      shouldConsider = true
    } else if (paramDate !== "" && itemDate !== "") {
      // both date-specific and equal
      shouldConsider = paramDate === itemDate
    } else if (paramDate !== "" && itemDate === "") {
      // new item has a date; default weekly schedule should be considered if it's for the same weekday
      const weekday = DAYS[new Date(paramDate).getDay()]
      shouldConsider = weekday === currentDay
    } else if (paramDate === "" && itemDate !== "") {
      // existing item has a date; consider if it falls on the same weekday
      const weekday = DAYS[new Date(itemDate).getDay()]
      shouldConsider = weekday === currentDay
    }
    if (!shouldConsider) continue
    const a = parseTimeToMinutes(item.startTime)
    const b = parseTimeToMinutes(item.endTime)
    if (a === null || b === null) continue
    // overlap if max(start) < min(end)
    const overlap = Math.max(a, s) < Math.min(b, e)
    if (overlap) return true
  }
  return false
}

// Modal helpers moved out of setup to be accessible globally
function openModal(modalEl, focusSelector) {
  if (!modalEl) return
  modalEl.style.display = 'flex'
  requestAnimationFrame(() => modalEl.classList.add('open'))
  modalEl.setAttribute('aria-hidden', 'false')
  modalEl.setAttribute('role', 'dialog')
  modalEl.setAttribute('aria-modal', 'true')
  const focusEl = focusSelector ? modalEl.querySelector(focusSelector) : modalEl
  if (focusEl && typeof focusEl.focus === 'function') focusEl.focus()
  const focusable = modalEl.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')
  const focusables = Array.from(focusable).filter((el) => !el.hasAttribute('disabled'))
  if (focusables.length) {
    modalEl._focusables = focusables
    modalEl._firstFocusable = focusables[0]
    modalEl._lastFocusable = focusables[focusables.length - 1]
    modalEl._trapHandler = function (e) {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === modalEl._firstFocusable) {
          e.preventDefault()
          modalEl._lastFocusable.focus()
        } else if (!e.shiftKey && document.activeElement === modalEl._lastFocusable) {
          e.preventDefault()
          modalEl._firstFocusable.focus()
        }
      }
      if (e.key === 'Escape') {
        closeModal(modalEl)
      }
    }
    modalEl.addEventListener('keydown', modalEl._trapHandler)
  }
}

function closeModal(modalEl, returnFocusTo) {
  if (!modalEl) return
  modalEl.classList.remove('open')
  const onTransitionEnd = (e) => {
    if (e.target === modalEl) {
      modalEl.style.display = 'none'
      modalEl.setAttribute('aria-hidden', 'true')
      modalEl.removeEventListener('transitionend', onTransitionEnd)
    }
  }
  modalEl.addEventListener('transitionend', onTransitionEnd)
  if (returnFocusTo && typeof returnFocusTo.focus === 'function') returnFocusTo.focus()
  if (modalEl._trapHandler) {
    modalEl.removeEventListener('keydown', modalEl._trapHandler)
    modalEl._trapHandler = null
    modalEl._focusables = null
  }
}

// Sets the date input to today's date (local timezone)
function setDateInputToToday() {
  const dateInput = document.getElementById("date")
  if (!dateInput) return
  const today = new Date()
  dateInput.value = formatDateToInputValue(today)
}

// Returns a Date corresponding to the next occurrence of the named weekday
// dayName must match one of the values in the DAYS array (e.g., 'Sunday')
// includeToday: if true and today is the same weekday, returns today; otherwise returns next week's day
function getNextDateForWeekday(dayName, includeToday = true) {
  const targetIndex = DAYS.indexOf(dayName)
  if (targetIndex === -1) return new Date()
  const today = new Date()
  const todayIndex = today.getDay()
  let daysUntil = (targetIndex - todayIndex + 7) % 7
  if (!includeToday && daysUntil === 0) {
    daysUntil = 7
  }
  const result = new Date(today)
  result.setDate(today.getDate() + daysUntil)
  return result
}

// Generate deterministic color for a course (based on code or name). Returns a HSL string.
function getColorForCourse(key) {
  if (!key) return 'hsl(220, 65%, 55%)'
  // djb2 hash
  let hash = 5381
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 33) ^ key.charCodeAt(i)
  }
  const hue = Math.abs(hash) % 360
  const saturation = 62
  const lightness = 52
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// Sets the date input to the next occurrence of the specified dayName
// If tempOnly is checked, the date will be set to today instead and the input disabled
function setDateInputToDay(dayName) {
  const dateInput = document.getElementById("date")
  if (!dateInput) return
  const tempOnlyEl = document.getElementById("tempOnly")
  if (tempOnlyEl && tempOnlyEl.checked) {
    setDateInputToToday()
    dateInput.disabled = true
    return
  }
  const nextDate = getNextDateForWeekday(dayName)
  dateInput.value = formatDateToInputValue(nextDate)
  dateInput.disabled = false
}

// Handle add/update class
function handleAddClass(e) {
  e.preventDefault()
  const formData = getFormData()
  const { course, courseCode, instructor, room, building, startTime, endTime, date, tempOnly } = formData

  // Validate required fields
  // Validate input fields
  const validation = validateFormData(formData)
  if (!validation.ok) {
    showFormError(validation.message)
    return
  }

  // Validate time order
  if (!isValidTimeRange(startTime, endTime)) {
    showFormError('Start time must be before end time')
    return
  }

  // Validate date vs selected day (unless tempOnly)
  if (!tempOnly && date) {
    const selectedDate = new Date(date)
    if (!Number.isNaN(selectedDate.getTime())) {
      const weekdayName = DAYS[selectedDate.getDay()]
      if (weekdayName !== currentDay) {
        // show date error and ask user to fix or confirm
        const shouldFix = confirm(`Selected date is ${weekdayName}, not ${currentDay}. Would you like to set the date to the next ${currentDay}?`)
        if (shouldFix) {
          setDateInputToDay(currentDay)
          clearFormError()
        } else {
          // Allow user to proceed if they really want the mismatch
          clearFormError()
        }
      }
    }
  }

  // Determine stored date for the class record: temp-only classes should have a specific date
  const storedDate = tempOnly ? (date || formatDateToInputValue(getNextDateForWeekday(currentDay))) : date

  if (editingId) {
    const schedule = [ ...(defaultSchedules[currentDay] || []), ...(tempSchedules[currentDay] || []) ]
    const classItem = schedule.find((c) => c.id === editingId)

    if (classItem) {
      // If the editing changed temp/default status, move class between schedules
      if (editingIsTemp !== tempOnly) {
        if (editingIsTemp && !tempOnly) {
          // temp -> default
          // Remove from tempSchedules
          tempSchedules[currentDay] = (tempSchedules[currentDay] || []).filter((c) => c.id !== editingId)
          if (!defaultSchedules[currentDay]) defaultSchedules[currentDay] = []
          defaultSchedules[currentDay].push(classItem)
        } else if (!editingIsTemp && tempOnly) {
          // default -> temp
          defaultSchedules[currentDay] = (defaultSchedules[currentDay] || []).filter((c) => c.id !== editingId)
          if (!tempSchedules[currentDay]) tempSchedules[currentDay] = []
          tempSchedules[currentDay].push(classItem)
        }
      }
      // Overlap check for edits (pass date); ignore defaults if this is a temp-only edit
      const ignoreDefaults = tempOnly
      if (isOverlappingWithOther(schedule, startTime, endTime, editingId, storedDate, ignoreDefaults)) {
        const proceed = confirm('This class overlaps another scheduled class. Proceed?')
        if (!proceed) return
      }
      classItem.course = course
      classItem.courseCode = courseCode
      classItem.instructor = instructor
      classItem.room = room
      classItem.building = building
      classItem.startTime = startTime
      classItem.endTime = endTime
      classItem.date = storedDate
      classItem.tempOnly = tempOnly

      if (editingIsTemp) {
        saveTempSchedules()
      } else {
        saveDefaultSchedules()
      }
      // If we changed status, save both to be safe
      if (editingIsTemp !== tempOnly) {
        saveTempSchedules()
        saveDefaultSchedules()
      }
    }

    cancelEdit()
  } else {
    // Overlap check for adding (pass date); ignore defaults if the new class is temporary
    const schedule = [ ...(defaultSchedules[currentDay] || []), ...(tempSchedules[currentDay] || []) ]
    const ignoreDefaults = tempOnly
    if (isOverlappingWithOther(schedule, startTime, endTime, null, storedDate, ignoreDefaults)) {
      const proceed = confirm('This class overlaps another scheduled class. Proceed?')
      if (!proceed) return
    }
    const newClass = {
      id: Date.now(),
      course,
      courseCode,
      instructor,
      room,
      building,
      startTime,
      endTime,
      date: storedDate,
      tempOnly,
    }

    if (tempOnly) {
      if (!tempSchedules[currentDay]) {
        tempSchedules[currentDay] = []
      }
      tempSchedules[currentDay].push(newClass)
      saveTempSchedules()
    } else {
      if (!defaultSchedules[currentDay]) {
        defaultSchedules[currentDay] = []
      }
      defaultSchedules[currentDay].push(newClass)
      saveDefaultSchedules()
    }

    document.getElementById("classForm").reset()
    clearFormError()
    // Put the date input back to the next occurrence of the currently selected tab day
    setDateInputToDay(currentDay)
    const dateInput = document.getElementById("date")
    if (dateInput) dateInput.disabled = false
  }

  renderSchedule()
}

function getFormData() {
  return {
    course: document.getElementById('course').value,
    courseCode: document.getElementById('courseCode').value,
    instructor: document.getElementById('instructor').value,
    room: document.getElementById('room').value,
    building: document.getElementById('building').value,
    startTime: document.getElementById('startTime').value,
    endTime: document.getElementById('endTime').value,
    date: document.getElementById('date').value,
    tempOnly: document.getElementById('tempOnly').checked,
  }
}

function validateFormData({ course, courseCode, instructor, room, building, startTime, endTime, date, tempOnly }) {
  if (!course || !courseCode || !instructor || !room || !building || !startTime || !endTime) {
    return { ok: false, message: 'Please fill in all required fields.' }
  }
  if (!isValidTimeRange(startTime, endTime)) {
    return { ok: false, message: 'Start time must be before end time.' }
  }
  // If date provided and not tempOnly, ensure it's a valid date string and matches the selected day
  if (!tempOnly && date) {
    const selectedDate = new Date(date)
    if (Number.isNaN(selectedDate.getTime())) {
      return { ok: false, message: 'Please enter a valid date.' }
    }
    const weekdayName = DAYS[selectedDate.getDay()]
    if (weekdayName !== currentDay) {
      // we allow user choice, but warn (handled in form handler with confirmation)
      return { ok: true, message: '' }
    }
  }
  return { ok: true }
}

// Handle delete class
function handleDeleteClass(id, isTemp) {
  const schedule = isTemp ? tempSchedules[currentDay] : defaultSchedules[currentDay]
  const index = schedule.findIndex((c) => c.id === id)
  if (index > -1) {
    schedule.splice(index, 1)
    if (isTemp) {
      saveTempSchedules()
    } else {
      saveDefaultSchedules()
    }
    renderSchedule()
  }
}

// Render schedule for current day
function renderSchedule() {
  const classList = document.getElementById("classList")
  const dayTitle = document.getElementById("dayTitle")
  dayTitle.textContent = currentDay

  const schedule = getCurrentSchedule(currentDay)
  const legendEl = document.getElementById('legend')
  if (schedule.length === 0) {
    renderEmptyState(currentDay)
    if (legendEl) legendEl.style.display = 'none'
    return
  }

  // Sort by start time
  const sorted = [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Prepare legend
  const uniqueCourses = Array.from(new Map(sorted.map((c) => [c.courseCode, c])).values())
  if (legendEl) {
    renderLegend(uniqueCourses)
  }
  // Render class cards using chunked rendering for large lists
  renderClassCardsChunked(sorted)
}

// New: Render empty state
function renderEmptyState(day) {
  const classList = document.getElementById('classList')
  classList.innerHTML = `
    <div class="empty-message">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M3 7h18" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="3" y="7" width="18" height="13" rx="2" stroke="#94a3b8" stroke-width="2"/>
        <path d="M7 11v-2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 11v-2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div style="margin-left: 12px; text-align: left;">
        <strong>No classes scheduled for ${day}</strong>
        <div style="color: var(--text-light);">Add classes using the form to get started.</div>
        <button id="addClassCta" class="btn btn-primary btn-small" style="margin-top:8px;">Add a Class</button>
      </div>
    </div>
  `
  const cta = document.getElementById('addClassCta')
  if (cta) cta.addEventListener('click', () => document.querySelector('.form-section').scrollIntoView({behavior: 'smooth'}))
}

// New: Render the legend
function renderLegend(uniqueCourses) {
  const legendEl = document.getElementById('legend')
  legendEl.innerHTML = ''
  uniqueCourses.forEach((c) => {
    const color = getColorForCourse(c.courseCode || c.course)
    const item = document.createElement('div')
    item.className = 'legend-item'
    item.innerHTML = `<span class="color-chip" style="background:${color}"></span><span>${c.courseCode}</span>`
    legendEl.appendChild(item)
  })
  legendEl.style.display = 'flex'
}

// New: Chunked rendering to avoid blocking UI for large schedules
function renderClassCardsChunked(sorted, chunkSize = 50) {
  const classList = document.getElementById('classList')
  classList.innerHTML = ''
  const total = sorted.length
  let idx = 0
  const frag = document.createDocumentFragment()

  function renderChunk() {
    const start = idx
    const end = Math.min(idx + chunkSize, total)
    for (let i = start; i < end; i++) {
      const cls = sorted[i]
      const isTemp = tempSchedules[currentDay]?.some((c) => c.id === cls.id)
      const color = getColorForCourse(cls.courseCode || cls.course)
      const wrapper = document.createElement('div')
      wrapper.className = 'class-card'
      wrapper.style.setProperty('--course-color', color)
      wrapper.innerHTML = `
        <div class="class-info">
          <div class="class-time">${cls.startTime} - ${cls.endTime}</div>
          <div class="class-course"><span class="course-name"><span class="course-color" style="background:${color}"></span>${cls.course} (${cls.courseCode})</span></div>
          <div class="class-details">
            <div><strong>Instructor:</strong> ${cls.instructor}</div>
            <div><strong>Room:</strong> ${cls.room} | <strong>Building:</strong> ${cls.building}</div>
            ${cls.date ? `<div><strong>Date:</strong> ${cls.date}</div>` : ""}
          </div>
          ${isTemp ? '<div class="class-temp-badge">Temporary (Today Only)</div>' : ""}
        </div>
        <div class="class-actions">
          <button class="btn btn-edit">Edit</button>
          <button class="btn btn-danger">Delete</button>
        </div>
      `
      // Attach handlers using dataset to avoid inline onclick; helps with refactor
      const editBtn = wrapper.querySelector('.btn-edit')
      const deleteBtn = wrapper.querySelector('.btn-danger')
      if (editBtn) editBtn.addEventListener('click', () => handleEditClass(cls.id, isTemp))
      if (deleteBtn) deleteBtn.addEventListener('click', () => handleDeleteClass(cls.id, isTemp))
      frag.appendChild(wrapper)
    }
    idx = end
    classList.appendChild(frag)
    if (idx < total) {
      // Use requestIdleCallback if available; fallback to setTimeout
      if (window.requestIdleCallback) {
        requestIdleCallback(renderChunk)
      } else {
        setTimeout(renderChunk, 0)
      }
    }
  }
  renderChunk()
}

function handleCopy() {
  // Copy the schedule for the currently selected day
  const schedule = getCurrentSchedule(currentDay)

  if (schedule.length === 0) {
    alert(`No classes scheduled for ${currentDay}`)
    return
  }

  // Apply format template for the selected day
  const formattedText = applyFormatTemplate(schedule, currentDay)

  // Show in modal for editing
  document.getElementById("scheduleText").value = formattedText
  openModal(document.getElementById("textEditorModal"), '#scheduleText')
}

// Handle reset
function handleReset() {
  if (confirm("Are you sure you want to reset to the default schedule? This will remove all temporary changes.")) {
    tempSchedules = {}
    DAYS.forEach((day) => {
      tempSchedules[day] = []
    })
    saveTempSchedules()
    cancelEdit()
    renderSchedule()
  }
}

function applyFormatTemplate(schedule, day) {
  const template = customFormatTemplate || DEFAULT_FORMAT_TEMPLATE
  const dayHeaderTemplate = template.dayHeader || DEFAULT_FORMAT_TEMPLATE.dayHeader
  const classLineTemplate = template.classLine || DEFAULT_FORMAT_TEMPLATE.classLine

  // Sort by start time
  const sorted = [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Get the next date for the provided day (the schedule day)
  const selectedDate = getNextDateForWeekday(day)
  const dateStr = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // The day name to use in the template is simply the provided day
  const selectedDayName = day

  // Generate day header (appears once)
  let dayHeader = dayHeaderTemplate
  dayHeader = dayHeader.replace(/{day}/g, selectedDayName)
  dayHeader = dayHeader.replace(/{date}/g, dateStr)

  // Generate class lines (one per class)
  const classLines = sorted.map((cls) => {
    let line = classLineTemplate
    line = line.replace(/{courseCode}/g, cls.courseCode)
    line = line.replace(/{courseName}/g, cls.course)
    line = line.replace(/{instructor}/g, cls.instructor)
    line = line.replace(/{room}/g, cls.room)
    line = line.replace(/{building}/g, cls.building)
    line = line.replace(/{startTime}/g, cls.startTime)
    line = line.replace(/{endTime}/g, cls.endTime)
    return line
  })

  return dayHeader + "\n" + classLines.join("\n")
}

function generateFormatPreview() {
  const dayHeaderTemplate = document.getElementById("formatDayHeader").value || DEFAULT_FORMAT_TEMPLATE.dayHeader
  const classLineTemplate = document.getElementById("formatClassLine").value || DEFAULT_FORMAT_TEMPLATE.classLine

  // Sample data for preview with multiple classes
  const sampleClasses = [
    {
      courseCode: "CS101",
      course: "Introduction to Computer Science",
      instructor: "Dr. Smith",
      room: "101",
      building: "Science Hall",
      startTime: "09:00",
      endTime: "10:30",
    },
    {
      courseCode: "MATH201",
      course: "Calculus II",
      instructor: "Prof. Johnson",
      room: "205",
      building: "Mathematics Building",
      startTime: "11:00",
      endTime: "12:30",
    },
  ]

  // Use the next occurrence of a sample day for the preview (e.g., Sunday)
  const sampleDay = "Sunday"
  const selectedDate = getNextDateForWeekday(sampleDay)

  const dateStr = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const previewDay = sampleDay

  // Generate day header
  let preview = dayHeaderTemplate
  preview = preview.replace(/{day}/g, previewDay)
  preview = preview.replace(/{date}/g, dateStr)

  // Generate class lines
  const classLines = sampleClasses.map((cls) => {
    let line = classLineTemplate
    line = line.replace(/{courseCode}/g, cls.courseCode)
    line = line.replace(/{courseName}/g, cls.course)
    line = line.replace(/{instructor}/g, cls.instructor)
    line = line.replace(/{room}/g, cls.room)
    line = line.replace(/{building}/g, cls.building)
    line = line.replace(/{startTime}/g, cls.startTime)
    line = line.replace(/{endTime}/g, cls.endTime)
    return line
  })

  preview = preview + "\n" + classLines.join("\n")
  document.getElementById("formatPreview").textContent = preview
}

// Start app
init()
