import CommonService  from './../common/service/common.js'

export default class InstitutionService extends CommonService {
  constructor(API, $http) {
    super(API, $http)
  }
  findById(slug) {
    super.setRoute('institutions')
    super.setPublicToken()
    return super.findById(slug)
  }
  findAll() {
    super.setRoute('institutions')
    super.setPublicToken()
    return super.findAll()
  }
  savePage(data, progress) {
    super.setRoute(`institutions/${data.uuid}/page`)
    return super.postWithFile(data, progress)
  }
  search(data) {
    super.setRoute('institutions')
    super.setPublicToken()
    super.setParams(data)
    return super.search()
  }
}

InstitutionService.$inject = ['API','$http']