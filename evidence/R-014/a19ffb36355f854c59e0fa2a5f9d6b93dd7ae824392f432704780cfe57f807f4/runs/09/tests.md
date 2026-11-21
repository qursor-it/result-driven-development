# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-9@example.test and password RddPass-9! Name the project RDD project 9. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-9@example.test, password RddPass-9!, project RDD project 9. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:29 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:32:06) |
| Duration | `0h 2m 22s 836ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-9@example.test and password RddPass-9! Name the project RDD project 9. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-9@example.test, password RddPass-9!, project RDD project 9. Run exactly one scenario. No destructive operations outside this flow.

#### A new anonymous visitor signs up with the given email and password and creates their first project named RDD project 9, ending on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 142s 836ms |

**Steps**

- Test started. Session name: FrightenedMagneticIvory799 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the Email and Password fields on the signup form with the pilot-specified credentials. _(2967ms)_
- Both fields are filled; submit the signup form once. _(1421ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Enter the required project name on the first-project creation form. _(1351ms)_
- Project name field is filled with 'RDD project 9'; submit the creation form once. _(1143ms)_
- Navigated to RDD project 9 — QA Notebook _(0ms)_
- The user is taken past the signup form into the application after submitting valid credentials _(0ms)_
- A project named RDD project 9 exists and is owned by the signed-up user _(0ms)_
- The dashboard of the project RDD project 9 is displayed to the user _(0ms)_
- Verification passed: On the page at /projects/1, the main heading reads exactly 'RDD project 9', a label 'Project dashboard' is shown, and the owner line reads 'Owner: rdd+R-014-9@example.test' _(0ms)_

**Message**

> Verification passed: On the page at /projects/1, the main heading reads exactly 'RDD project 9', a label 'Project dashboard' is shown, and the owner line reads 'Owner: rdd+R-014-9@example.test'

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField({"role":"textbox","text":"Email"}, "rdd+R-014-9@example.test")
I.fillField({"role":"textbox","text":"Password"}, "RddPass-9!")
I.click({"role":"button","text":"Sign up"})
I.fillField({"role":"textbox","text":"Project name"}, "RDD project 9")
I.click({"role":"button","text":"Create project"})
I.see("RDD project 9", "h1")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-9@example.test", "main")
I.seeElement({"role":"heading","text":"RDD project 9"})
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-9@example.test", "main")
I.seeElement("h1")
I.see("RDD project 9", "h1")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-9@example.test", "main")
```
