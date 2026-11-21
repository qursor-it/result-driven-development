# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-19@example.test and password RddPass-19! Name the project RDD project 19. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-19@example.test, password RddPass-19!, project RDD project 19. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T07:00 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 08:02:42) |
| Duration | `0h 2m 27s 981ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-19@example.test and password RddPass-19! Name the project RDD project 19. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-19@example.test, password RddPass-19!, project RDD project 19. Run exactly one scenario. No destructive operations outside this flow.

#### A new user signs up with the provided credentials and creates their first project named RDD project 19, then sees that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 147s 981ms |

**Steps**

- Test started. Session name: LazyStandardPeach718 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Filling the Email field on the signup form with the provided test email. _(1574ms)_
- Email filled. Now filling the Password field. _(1263ms)_
- filled Email rdd+R-014-19@example.test _(0ms)_
- filled Password field _(0ms)_
- click Sign up to create account _(0ms)_
- Both Email and Password are filled; submitting the signup form to create the account. _(1176ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Signed up rdd+R-014-19@example.test, redirected to /projects/new _(0ms)_
- The account is created and the user is signed in _(0ms)_
- Next: fill new project form with RDD project 19 _(0ms)_
- On the first-project onboarding form. Filling the Project name field; including the session identifier LazyStandardPeach718 in the value as required. _(1531ms)_
- The expected result requires a project named exactly 'RDD project 19' (Pilot's plan also specifies that verbatim name), so I clear the field and set the exact project name before submitting. _(2308ms)_
- Project name field now holds exactly 'RDD project 19'. Submitting the form to create the first project. _(1124ms)_
- Navigated to RDD project 19 — QA Notebook _(0ms)_
- Signed up rdd+R-014-19@example.test and created project RDD project 19 _(0ms)_
- A project named RDD project 19 exists and is owned by the signed-in user _(0ms)_
- The dashboard for RDD project 19 is displayed _(0ms)_
- Verification passed: On page /projects/1, the main heading reads exactly "RDD project 19" and the owner line below it shows "Owner: rdd+R-014-19@example.test" — the project created by the signed-in user _(0ms)_

**Message**

> Verification passed: On page /projects/1, the main heading reads exactly "RDD project 19" and the owner line below it shows "Owner: rdd+R-014-19@example.test" — the project created by the signed-in user

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("input[name="email"]", "rdd+R-014-19@example.test")
I.fillField("input[name="password"]", "RddPass-19!")
I.click({"role":"button","text":"Sign up"})
I.fillField("input#name", "RDD project 19 LazyStandardPeach718")
I.pressKey(["Control","a"])
I.pressKey("Backspace")
I.fillField("input#name", "RDD project 19")
I.click({"role":"button","text":"Create project"})
I.see("RDD project 19", "h1")
I.see("Owner: rdd+R-014-19@example.test", "main")
I.seeElement({"role":"heading","text":"RDD project 19"})
I.see("Owner: rdd+R-014-19@example.test", "//main/p[2]")
I.see("RDD project 19", "main > h1")
I.see("Owner: rdd+R-014-19@example.test", "//main//p[contains(., "Owner:")]")
I.seeInTitle("RDD project 19")
I.seeElement({"role":"heading","text":"RDD project 19"})
I.see("Project dashboard", "main")
I.see("RDD project 19", "h1")
I.see("Project dashboard", "main")
I.seeInTitle("RDD project 19")
I.seeInSource("RDD project 19")
I.seeInSource("Project dashboard")
I.see("Project dashboard", "main")
```
