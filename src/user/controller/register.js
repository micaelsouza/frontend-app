export default class UserRegister {
  constructor($scope, $stateParams, $state, $filter, Hydrator, UserService) {
    this.service = UserService
    this.hydrator = Hydrator
    this.state = $state
    this.filter = $filter
    this.user = {
      gender: 'Feminino',
    }
    this.showPassword = false
    this.typeInputPassword = 'password'
  }
  toggleShowPassword() {
    this.typeInputPassword = this.showPassword ? 'text' : 'password'
  }
  registerFacebook() {
    this.service.registerFacebook(response => {
      this.register(response)
    })
  }
  checkOfAge(age) {
    let date = new Date(),
        timeDiff = date - age,
        diffDays = timeDiff / (1000 * 3600 * 24 * 365)
    return (diffDays < 18) ? false : true

  }
  register(user) {
    user = (user) ? angular.copy(user) : angular.copy(this.user)
    let birthdate
    if (user.facebook_token) {
      user.gender = (user.gender == 'male') ? 'Masculino' : 'Feminino'
      birthdate = user.birthday.split('/')
      user.birthdate = new Date(`${birthdate[2]}-${birthdate[0]}-${birthdate[1]}`)
    } else {
      birthdate = user.birthdate.split('/')
      user.birthdate = new Date(`${birthdate[2]}-${birthdate[1]}-${birthdate[0]}`)
    }
    if (!this.checkOfAge(user.birthdate)) {
      this.error = {
        errors: {
          birthdate: ['Desculpe, não podemos aceitar usuários menores de idade.']
        }
      }
    } else {
      user.birthdate = this.filter('date')(user.birthdate.setDate(user.birthdate.getDate() + 1), 'yyyy-MM-dd')
      console.log(JSON.stringify(user))
      this.service.register(user)
        .then(
          response => this.registerSuccess(response),
          response => this.registerError(response)  
        )
    }
  }
  registerSuccess(response) {
    console.log(response)
  }
  registerError(response) {
    this.error = response.data
    console.error(response)
  }
}

UserRegister.$inject = ['$scope', '$stateParams', '$state', '$filter', 'Hydrator', 'UserService']