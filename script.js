document.addEventListener("DOMContentLoaded", () => {
  let localConnection;
  let selectedDataPoints = [];
  let receivedData = {};
  let allDataPoints = [];

  const wsUrlInput = document.getElementById("wsUrlInput");
  const connectBtn = document.getElementById("connectBtn");
  const disconnectBtn = document.getElementById("disconnectBtn");
  const statusDiv = document.getElementById("status");
  const dataPointInput = document.getElementById("dataPointInput");
  const addDataPointBtn = document.getElementById("addDataPointBtn");
  const selectedDataDiv = document.getElementById("selectedData");
  const dataPointDropdown = document.getElementById("dataPointDropdown");

  function connectToWebSocket() {
    const url = wsUrlInput.value;
    if (!url) {
      alert("Please enter a WebSocket URL");
      return;
    }

    localConnection = new WebSocket(url);

    localConnection.onopen = () => {
      console.log("WebSocket Connected");
      statusDiv.textContent = "Connected";
      updateButtons();
      fetchInitialData();
    };

    localConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        receivedData = data;
        displaySelectedData(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    localConnection.onclose = () => {
      console.log("WebSocket Closed");
      statusDiv.textContent = "Disconnected";
      updateButtons();
    };

    localConnection.onerror = (error) => {
      console.error("WebSocket Error: ", error);
    };
  }

  function fetchInitialData() {
    localConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        receivedData = data;
        populateDataPointDropdown(data);
        localConnection.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            receivedData = data;
            displaySelectedData(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };
      } catch (error) {
        console.error("Error parsing initial WebSocket message:", error);
      }
    };
  }

  function disconnectFromWebSocket() {
    if (localConnection) {
      localConnection.close();
    }
  }

  function updateButtons() {
    connectBtn.disabled =
      localConnection && localConnection.readyState === WebSocket.OPEN;
    disconnectBtn.disabled =
      !localConnection || localConnection.readyState !== WebSocket.OPEN;
  }

  function addDataPoint() {
    const point = dataPointInput.value;
    if (point && !selectedDataPoints.includes(point)) {
      selectedDataPoints.push(point);
      updateSelectedDataDisplay();
      dataPointInput.value = "";
    }
  }

  function removeDataPoint(point) {
    selectedDataPoints = selectedDataPoints.filter((p) => p !== point);
    updateSelectedDataDisplay();
  }

  function updateSelectedDataDisplay() {
    selectedDataDiv.innerHTML = "";
    selectedDataPoints.forEach((point, index) => {
      const row = document.createElement("tr");
      const indexCell = document.createElement("td");
      indexCell.textContent = index + 1;

      const pointCell = document.createElement("td");
      pointCell.textContent = point;

      const valueCell = document.createElement("td");
      const value = point
        .split(".")
        .reduce((obj, key) => obj && obj[key], receivedData);
      valueCell.textContent = value !== undefined ? value : "N/A";

      const actionCell = document.createElement("td");
      const removeButton = document.createElement("button");
      removeButton.textContent = "Remove";
      removeButton.onclick = () => removeDataPoint(point);

      actionCell.appendChild(removeButton);

      row.appendChild(indexCell);
      row.appendChild(pointCell);
      row.appendChild(valueCell);
      row.appendChild(actionCell);

      selectedDataDiv.appendChild(row);
    });
  }

  function displaySelectedData(data) {
    updateSelectedDataDisplay();
  }

  function populateDataPointDropdown(data, prefix = "") {
    Object.keys(data).forEach((key) => {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      if (typeof data[key] === "object" && data[key] !== null) {
        populateDataPointDropdown(data[key], newPrefix);
      } else {
        allDataPoints.push(newPrefix);
      }
    });

    dataPointDropdown.innerHTML = "";
    allDataPoints.forEach((point) => {
      const option = document.createElement("option");
      option.value = point;
      option.textContent = point;
      dataPointDropdown.appendChild(option);
    });

    dataPointInput.addEventListener("input", () => {
      const searchText = dataPointInput.value.toLowerCase();
      dataPointDropdown.innerHTML = "";
      allDataPoints
        .filter((point) => point.toLowerCase().includes(searchText))
        .forEach((point) => {
          const option = document.createElement("option");
          option.value = point;
          option.textContent = point;
          dataPointDropdown.appendChild(option);
        });
    });

    dataPointDropdown.addEventListener("change", () => {
      dataPointInput.value = dataPointDropdown.value;
    });
  }

  connectBtn.addEventListener("click", connectToWebSocket);
  disconnectBtn.addEventListener("click", disconnectFromWebSocket);
  addDataPointBtn.addEventListener("click", addDataPoint);
  updateButtons();
});
