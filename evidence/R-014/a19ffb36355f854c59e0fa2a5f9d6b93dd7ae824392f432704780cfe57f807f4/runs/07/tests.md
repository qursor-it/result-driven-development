# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-7@example.test and password RddPass-7! Name the project RDD project 7. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-7@example.test, password RddPass-7!, project RDD project 7. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:25 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:27:16) |
| Duration | `0h 2m 4s 296ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-7@example.test and password RddPass-7! Name the project RDD project 7. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-7@example.test, password RddPass-7!, project RDD project 7. Run exactly one scenario. No destructive operations outside this flow.

#### A new anonymous visitor signs up with the given credentials and creates their first project named RDD project 7, then sees that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 124s 296ms |

**Steps**

- Test started. Session name: XenaciousFreshMoccasin533 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the signup Email and Password fields with the planned credentials. _(3480ms)_
- Submit the signup form now that both Email and Password are confirmed filled. _(1421ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- signup accepted, redirected to /projects/new _(0ms)_
- The signup form is accepted and the user is taken past the signup page into the signed-in application _(0ms)_
- next: fill project name RDD project 7 _(0ms)_
- Fill the project name field with 'RDD project 7' in the first-project onboarding form. _(1279ms)_
- Submit the first-project form to create 'RDD project 7' and advance to its dashboard. _(1156ms)_
- Navigated to RDD project 7 — QA Notebook _(0ms)_
- heading 'RDD project 7' on /projects/1 _(0ms)_
- A project named RDD project 7 exists and is owned by the signed-up user _(0ms)_
- The dashboard for RDD project 7 is displayed to the user _(0ms)_
- Verification passed: On page /projects/1 in the main area, the project dashboard for the newly created project is displayed: the heading reads exactly 'RDD project 7', a 'Project dashboard' subtitle is present, and the owner line shows the email rdd+R-014-7@example.test used to sign up (i.e., the project is owned by that signed-up user). _(0ms)_

**Message**

> Verification passed: On page /projects/1 in the main area, the project dashboard for the newly created project is displayed: the heading reads exactly 'RDD project 7', a 'Project dashboard' subtitle is present, and the owner line shows the email rdd+R-014-7@example.test used to sign up (i.e., the project is owned by that signed-up user).

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField({"role":"textbox","text":"Email"}, "rdd+R-014-7@example.test")
I.fillField({"role":"textbox","text":"Password"}, "RddPass-7!")
I.click({"role":"button","text":"Sign up"}, "[action="/signup"]")
I.fillField({"role":"textbox","text":"Project name"}, "RDD project 7")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.see("RDD project 7", "main h1")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-7@example.test", "main")
```
