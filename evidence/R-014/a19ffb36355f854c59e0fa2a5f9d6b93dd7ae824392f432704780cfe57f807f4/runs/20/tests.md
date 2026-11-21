# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-20@example.test and password RddPass-20! Name the project RDD project 20. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-20@example.test, password RddPass-20!, project RDD project 20. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T07:03 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 08:05:34) |
| Duration | `0h 1m 58s 730ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-20@example.test and password RddPass-20! Name the project RDD project 20. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-20@example.test, password RddPass-20!, project RDD project 20. Run exactly one scenario. No destructive operations outside this flow.

#### An anonymous visitor signs up with the given email and password, creates their first project named RDD project 20, and lands on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 118s 730ms |

**Steps**

- Test started. Session name: GeneticSemanticOrange268 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the signup form's Email and Password fields with the planned test credentials. _(2171ms)_
- Submit the signup form after filling both credentials. _(1166ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the first-project creation form with the project name RDD project 20. _(1300ms)_
- Submit the project creation form now that the name field contains RDD project 20. _(1132ms)_
- Navigated to RDD project 20 — QA Notebook _(0ms)_
- The account is created and the user is signed in after submitting the signup form _(0ms)_
- The newly created project RDD project 20 is listed or shown as owned by the signed-in user _(0ms)_
- The dashboard of RDD project 20 is displayed after project creation _(0ms)_
- Verified heading 'RDD project 20' and owner rdd+R-014-20@example.test _(0ms)_
- Verification passed: On the /projects/1 page titled 'RDD project 20 — QA Notebook', the dashboard for project 'RDD project 20' is displayed: the main heading reads exactly 'RDD project 20', and an owner line reads 'Owner: rdd+R-014-20@example.test', confirming the newly created project belongs to the signed-in user. _(0ms)_

**Message**

> Verification passed: On the /projects/1 page titled 'RDD project 20 — QA Notebook', the dashboard for project 'RDD project 20' is displayed: the main heading reads exactly 'RDD project 20', and an owner line reads 'Owner: rdd+R-014-20@example.test', confirming the newly created project belongs to the signed-in user.

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("#email", "rdd+R-014-20@example.test")
I.fillField("#password", "RddPass-20!")
I.click({"role":"button","text":"Sign up"}, "[action="/signup"]")
I.fillField("#name", "RDD project 20")
I.click({"role":"button","text":"Create project"}, "form[action*="/projects/new"]")
I.see("RDD project 20", "h1")
I.see("Owner: rdd+R-014-20@example.test", "main")
I.seeElement({"role":"heading","text":"RDD project 20"})
```
