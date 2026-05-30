document.addEventListener("DOMContentLoaded", () => {
	const form = document.getElementById("grad-form");
	const phoneInput = document.getElementById("phone");
	const formStatus = document.getElementById("form-status");

	if (!form || !phoneInput || !formStatus) {
		return;
	}

	const maskTemplate = "(___) ___ ____";
	const slotPositions = [1, 2, 3, 6, 7, 8, 10, 11, 12, 13];

	const formatWithMask = (digits) => {
		let digitIndex = 0;
		let formatted = "";

		for (const char of maskTemplate) {
			if (char === "_") {
				formatted += digitIndex < digits.length ? digits[digitIndex] : "_";
				digitIndex += 1;
			} else {
				formatted += char;
			}
		}

		return formatted;
	};

	const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "").slice(0, 10);

	const digitIndexFromCursor = (cursorPosition) => {
		let count = 0;

		for (const position of slotPositions) {
			if (position < cursorPosition) {
				count += 1;
			}
		}

		return Math.min(Math.max(count, 0), 10);
	};

	const cursorFromDigitIndex = (digitIndex) => {
		if (digitIndex <= 0) {
			return slotPositions[0];
		}

		if (digitIndex >= 10) {
			return maskTemplate.length;
		}

		return slotPositions[digitIndex];
	};

	const syncValidity = (digits) => {
		if (digits.length === 10) {
			phoneInput.setCustomValidity("");
			return;
		}

		phoneInput.setCustomValidity("Please enter exactly 10 digits.");
	};

	const setMaskedValue = (digits, caretDigitIndex) => {
		const cleanDigits = digitsOnly(digits);
		phoneInput.value = formatWithMask(cleanDigits);
		syncValidity(cleanDigits);

		const caretPosition = cursorFromDigitIndex(caretDigitIndex);
		phoneInput.setSelectionRange(caretPosition, caretPosition);
	};

	const ensureMaskVisible = () => {
		if (!phoneInput.value) {
			phoneInput.value = maskTemplate;
			phoneInput.setSelectionRange(slotPositions[0], slotPositions[0]);
		}
	};

	// Start empty and show mask on focus for a friendlier first interaction.
	syncValidity("");

	phoneInput.addEventListener("focus", () => {
		ensureMaskVisible();
	});

	phoneInput.addEventListener("blur", () => {
		const digits = digitsOnly(phoneInput.value);

		if (!digits.length) {
			phoneInput.value = "";
		}
	});

	phoneInput.addEventListener("keydown", (event) => {
		const isShortcut = event.ctrlKey || event.metaKey || event.altKey;

		if (isShortcut) {
			return;
		}

		const allowedNavKeys = ["Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
		if (allowedNavKeys.includes(event.key)) {
			return;
		}

		ensureMaskVisible();

		const currentDigits = digitsOnly(phoneInput.value);
		const selectionStart = phoneInput.selectionStart ?? slotPositions[0];
		const selectionEnd = phoneInput.selectionEnd ?? selectionStart;
		const startDigitIndex = digitIndexFromCursor(selectionStart);
		const endDigitIndex = digitIndexFromCursor(selectionEnd);

		if (/^\d$/.test(event.key)) {
			event.preventDefault();
			let nextDigits = currentDigits;

			if (selectionStart !== selectionEnd) {
				nextDigits = `${currentDigits.slice(0, startDigitIndex)}${currentDigits.slice(endDigitIndex)}`;
			}

			if (nextDigits.length >= 10) {
				return;
			}

			nextDigits = `${nextDigits.slice(0, startDigitIndex)}${event.key}${nextDigits.slice(startDigitIndex)}`;
			setMaskedValue(nextDigits, startDigitIndex + 1);
			return;
		}

		if (event.key === "Backspace") {
			event.preventDefault();
			let nextDigits = currentDigits;

			if (selectionStart !== selectionEnd) {
				nextDigits = `${currentDigits.slice(0, startDigitIndex)}${currentDigits.slice(endDigitIndex)}`;
				setMaskedValue(nextDigits, startDigitIndex);
				return;
			}

			if (startDigitIndex === 0) {
				return;
			}

			const deleteIndex = startDigitIndex - 1;
			nextDigits = `${currentDigits.slice(0, deleteIndex)}${currentDigits.slice(deleteIndex + 1)}`;
			setMaskedValue(nextDigits, deleteIndex);
			return;
		}

		if (event.key === "Delete") {
			event.preventDefault();
			let nextDigits = currentDigits;

			if (selectionStart !== selectionEnd) {
				nextDigits = `${currentDigits.slice(0, startDigitIndex)}${currentDigits.slice(endDigitIndex)}`;
				setMaskedValue(nextDigits, startDigitIndex);
				return;
			}

			if (startDigitIndex >= currentDigits.length) {
				return;
			}

			nextDigits = `${currentDigits.slice(0, startDigitIndex)}${currentDigits.slice(startDigitIndex + 1)}`;
			setMaskedValue(nextDigits, startDigitIndex);
			return;
		}

		if (typeof event.key === "string" && event.key.length === 1) {
			event.preventDefault();
		}
	});

	phoneInput.addEventListener("paste", (event) => {
		event.preventDefault();
		ensureMaskVisible();

		const pasteText = event.clipboardData?.getData("text") ?? "";
		const pastedDigits = digitsOnly(pasteText);
		const currentDigits = digitsOnly(phoneInput.value);

		const selectionStart = phoneInput.selectionStart ?? slotPositions[0];
		const selectionEnd = phoneInput.selectionEnd ?? selectionStart;
		const startDigitIndex = digitIndexFromCursor(selectionStart);
		const endDigitIndex = digitIndexFromCursor(selectionEnd);

		const nextDigits = `${currentDigits.slice(0, startDigitIndex)}${pastedDigits}${currentDigits.slice(endDigitIndex)}`.slice(0, 10);
		const nextCaretDigitIndex = Math.min(startDigitIndex + pastedDigits.length, 10);
		setMaskedValue(nextDigits, nextCaretDigitIndex);
	});

	phoneInput.addEventListener("input", () => {
		// Fallback for browser autofill or mobile keyboards.
		const digits = digitsOnly(phoneInput.value);
		setMaskedValue(digits, digits.length);
	});

	form.addEventListener("submit", (event) => {
		event.preventDefault();
		formStatus.textContent = "";
		formStatus.className = "";

		const digits = digitsOnly(phoneInput.value);
		syncValidity(digits);

		if (!phoneInput.checkValidity()) {
			phoneInput.reportValidity();
			return;
		}

		// Submit digits only to the server after validation passes.
		phoneInput.value = digits;

		fetch(form.action, {
			method: form.method,
			headers: {
				"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
			},
			body: new URLSearchParams(new FormData(form))
		})
			.then(async (response) => {
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.message || "Submission failed.");
				}

				window.alert(data.message || "Submission successful!");
				form.reset();
				phoneInput.value = "";
				formStatus.textContent = "";
				formStatus.className = "";

				window.location.reload();
			})
			.catch((error) => {
				window.alert(error.message);
				formStatus.textContent = error.message;
				formStatus.className = "form-status form-status--error";
			});
	});
});
