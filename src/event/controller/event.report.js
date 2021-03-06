class EventReport {
  constructor($state, $stateParams,EventService,StorageService,$uibModal,$rootScope) {
    this.state = $state
    this.service = EventService
    this.profile = StorageService.getItem('profile')
    if ($stateParams.uuid) {
      this.uuid = $stateParams.uuid
      this.getReport($stateParams.uuid)
    }
    this.myInterval = 5000;
    this.noWrapSlides = false;
    this.active = 0;
    this.pagination = { current_page: 1 }
    this.modal = $uibModal
    this.rootScope = $rootScope
    this.benefit = {
      children: 'crianças',
      young: 'jovens',
      people: 'pessoas',
      families: 'familias',
      elderly: 'idosos',
      animals: 'animais',
      dogs: 'cachorros',
      cats: 'gatos',
      trees: 'árvores'
    }
  }
  getRepeat(num) {
    return new Array(num)
  }
  getMessages(id, params) {
    let method = (this.profile) ? 'getMessages' : 'getMessagesPublic'
    params.page = this.pagination.current_page
    this.service[method](id, params)
      .then(response => {
        this.pagination = response.data.meta.pagination
        this.report.messages = response.data
      })
  }
  getReport(id) {
    let method = (this.profile) ? 'getReport' : 'getReportPublic'
    this.service[method](id)
      .then(
        response => {
          if (response.data) {
            this.report = response.data
            if (this.report.messages.contains) {
              this.getMessages(this.uuid, {})
            }
            this.slides = []
            // if (this.report.picture1.thumb == '/assets/images/reports/pictures/thumb/missing.jpg') {
            //   this.slides = [
            //     {
            //       id: 1,
            //       image: '/assets/images/report-default-image-1.jpg'
            //     }
            //   ]
            // }
            let x, picture
            for (x = 0; x < 3; x++) {
              picture = `picture${x + 1}`
              this.slides.push({
                id: x,
                image: this.report[picture].original
              })
            }
            if (!this.report.authorized_on && (this.profile.permissions['administration.global'] || this.profile.permissions.authorize_report)) {
              this.authorize_report = true
            }
          }
        },
        error => {
          this.state.go('pages.not-found', {seeking: 'relatório social', message: error.data.message})

        }
      )
  }
  authorizeReport() {
    let modalInstance = this.modal.open({
      templateUrl: './../src/event/view/report.authorize.html',
      controller: 'ReportAuthorize',
      controllerAs: 'ctrl',
      resolve: {
        uuid: () => {
          return this.report.uuid
        }
      }
    })
    modalInstance.result.then(response => {
      this.rootScope.$broadcast('alert', {type: 'alert-success', icon: 'fa-check', message: response.status})
    }, error => {
      this.rootScope.$broadcast('alert', {type: 'alert-danger', icon: 'fa-exclamation', message: error})
    })
  }
}

EventReport.$inject = ['$state','$stateParams','EventService','StorageService','$uibModal','$rootScope']

export default EventReport