import {
  MockBusRepository,
  MockLogisticsRepository,
  MockTrafficRepository,
  MockEVRepository,
  MockDepotRepository,
  MockSimulationRepository,
  MockOptimizationRepository,
} from "./mockRepositories";
import {
  IBusRepository,
  ILogisticsRepository,
  ITrafficRepository,
  IEVRepository,
  IDepotRepository,
  ISimulationRepository,
  IOptimizationRepository,
} from "./types";

export const busRepository: IBusRepository = new MockBusRepository();
export const logisticsRepository: ILogisticsRepository = new MockLogisticsRepository();
export const trafficRepository: ITrafficRepository = new MockTrafficRepository();
export const evRepository: IEVRepository = new MockEVRepository();
export const depotRepository: IDepotRepository = new MockDepotRepository();
export const simulationRepository: ISimulationRepository = new MockSimulationRepository();
export const optimizationRepository: IOptimizationRepository = new MockOptimizationRepository();
