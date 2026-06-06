---
name: Relative paths break native url-input validation
description: Why form fields holding relative upload paths must not be type=url (family-chart builder avatar)
---

# Relative upload paths must use a text input, not a url input

When a form field stores an **object-storage upload path** that is a relative URL
(e.g. `/api/objects/uploads/<uuid>`), the field must be `type: 'text'`, not
`type: 'url'`.

**Why:** `<input type="url">` enforces native constraint validation requiring an
*absolute* URL. A relative path fails that check. Crucially, `form.requestSubmit()`
runs constraint validation, so the submit is silently blocked — no error thrown,
the value never reaches the data model, and nothing is saved. This presents as
"upload works on screen but does not persist after reload." It would also block the
regular Submit button whenever an uploaded photo is present.

**How to apply:** In the family-chart visual builder (`examples/create-tree.html`),
the `avatar` field in `FIELDS` is `type: 'text'` for this reason. The
family-chart edit form only commits field values to its data model on form
**submit** (it reads `FormData` from the `<form>`); merely setting `input.value`
and dispatching `input`/`change` events does NOT persist. After an upload, set the
input value then call `form.requestSubmit()` to commit + trigger the autosave.
Avoid storing an absolute origin URL just to satisfy url-validation — the domain
differs between dev and prod, so a stored absolute URL would break.
