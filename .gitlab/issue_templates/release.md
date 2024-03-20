- **Version:** (Release version string)
- **Milestone:** (Link to milestone)

## QA checklist

! NOTE (delete before creating the release issue): lines with _[if applicable]_ suffix are not needed for every release- remove/keep them as needed.

### Pre-testing

- [ ] all spec branches are merged to `abp-ui-next` ([spec repository](https://gitlab.com/adblockinc/ext/adblockplus/spec/-/tree/master/spec/abp)) _[@person_responsible]_ [if applicable]
- [ ] regression tests are updated ([cucumber project](https://studio.cucumber.io/projects/283030)) _[@person_responsible]_ [if applicable]
- [ ] testpages autotests are passing _[@person_responsible]_
- [ ] E2E autotests are passing (all & old browsers pipelines) _[@person_responsible]_
- [ ] test runs are created _[@person_responsible]_

### Release testing

- [ ] retest issues that need retesting [if applicable]
- [ ] **Edge, Opera, Yandex: latest | Chrome, Firefox: minimum** (Link to testrun) _[@person_responsible]_
- [ ] **Chrome other** (Link to testrun) _[@person_responsible]_
- [ ] **Chrome misc** (Link to testrun) _[@person_responsible]_ [if applicable]
- [ ] **Chrome latest** (Link to testrun) _[@person_responsible]_
- [ ] **Firefox latest** (Link to testrun) _[@person_responsible]_


### Filterlist updates

- [ ]  E2E autotests are passing (filterlists pipeline)

### Post-testing

- [ ] merge spec branch `abp-ui-next` to `master` ([spec repository](https://gitlab.com/adblockinc/ext/adblockplus/spec/-/tree/master/spec/abp)) [if applicable]

/milestone %MILESTONE
/label ~"Product:: ABP"
