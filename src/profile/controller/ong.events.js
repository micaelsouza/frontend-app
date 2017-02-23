export default class OngEvents {
  constructor($rootScope, ProfileService) {
    this.rootScope = $rootScope
    this.service = ProfileService
    this.pendings = 0
    this.pagination = { current_page: 1 }
    this.getEvents()
  }
  getEvents() {
    this.service.getEvents({
      withoutReport: true,
      page: this.pagination.current_page
    }).then(response => {
      // console.log(response)
      this.pagination = response.data.meta.pagination
      this.events = response.data.values.map(event => {
        event.dateStartSubmissionReport = new Date(event.dateStartSubmissionReport)
        return event
      })
      this.pendings = response.data.values.filter(event => {
        return (event.needReport == true)
      })
      if (this.pendings.length > 0) {
        this.rootScope.$broadcast('alert', {
          type: 'alert-warning',
          icon: 'fa-warning',
          message: {
            message: `Você tem ${this.pendings.length} relatórios pendentes.`
          }
        })
      }
    })
  }
  changePage() {
    this.getEvents()
  }
}

OngEvents.$inject = ['$rootScope','ProfileService']