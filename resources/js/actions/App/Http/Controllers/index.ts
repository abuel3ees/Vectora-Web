import AppSettingsController from './AppSettingsController'
import DashboardController from './DashboardController'
import UserController from './UserController'
import DispatchRouteController from './DispatchRouteController'
import FleetController from './FleetController'
import AnalyticsController from './AnalyticsController'
import DriverAssignmentController from './DriverAssignmentController'
import OperationsController from './OperationsController'
import OptimizeController from './OptimizeController'
import MessageController from './MessageController'
import DriverAuthController from './DriverAuthController'
import DriverStatsController from './DriverStatsController'
import Settings from './Settings'

const Controllers = {
    AppSettingsController: Object.assign(AppSettingsController, AppSettingsController),
    DashboardController: Object.assign(DashboardController, DashboardController),
    UserController: Object.assign(UserController, UserController),
    DispatchRouteController: Object.assign(DispatchRouteController, DispatchRouteController),
    FleetController: Object.assign(FleetController, FleetController),
    AnalyticsController: Object.assign(AnalyticsController, AnalyticsController),
    DriverAssignmentController: Object.assign(DriverAssignmentController, DriverAssignmentController),
    OperationsController: Object.assign(OperationsController, OperationsController),
    OptimizeController: Object.assign(OptimizeController, OptimizeController),
    MessageController: Object.assign(MessageController, MessageController),
    DriverAuthController: Object.assign(DriverAuthController, DriverAuthController),
    DriverStatsController: Object.assign(DriverStatsController, DriverStatsController),
    Settings: Object.assign(Settings, Settings),
}

export default Controllers