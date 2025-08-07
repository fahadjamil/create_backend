
module.exports = (app) => {
    require('./user.router')(app)
    require('./car.inspection.router')(app)
    require('./asset.route')(app)
    require('./salaried.individuals.router')(app)
    require('./administration.form.route')(app)
    require('./contract.route')(app)
    require('./agent.route')(app)
    require('./bank.rounte')(app)
    require('./notification.route')(app)
}