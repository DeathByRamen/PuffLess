import Foundation
import HealthKit

@MainActor
final class HealthKitManager: ObservableObject {
    static let shared = HealthKitManager()

    @Published var isAvailable = false
    @Published var isAuthorized = false
    @Published var restingHeartRate: Double?
    @Published var averageSleepHours: Double?
    @Published var averageSteps: Double?

    private let store = HKHealthStore()

    private let readTypes: Set<HKObjectType> = {
        var types = Set<HKObjectType>()
        if let hr = HKObjectType.quantityType(forIdentifier: .restingHeartRate) { types.insert(hr) }
        if let sleep = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(sleep) }
        if let steps = HKObjectType.quantityType(forIdentifier: .stepCount) { types.insert(steps) }
        return types
    }()

    func checkAvailability() {
        isAvailable = HKHealthStore.isHealthDataAvailable()
    }

    func requestAuthorization() async {
        guard isAvailable else { return }

        do {
            try await store.requestAuthorization(toShare: [], read: readTypes)
            isAuthorized = true
        } catch {
            isAuthorized = false
        }
    }

    // MARK: - Data Fetching

    func fetchRestingHeartRate(days: Int = 7) async {
        guard let type = HKQuantityType.quantityType(forIdentifier: .restingHeartRate) else { return }

        let startDate = Calendar.current.date(byAdding: .day, value: -days, to: .now)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: .now, options: .strictEndDate)
        let descriptor = HKStatisticsQueryDescriptor(
            predicate: .init(value: predicate),
            options: .discreteAverage
        )

        do {
            let result = try await descriptor.result(for: store)
            restingHeartRate = result?.averageQuantity()?.doubleValue(for: HKUnit(from: "count/min"))
        } catch {
            restingHeartRate = nil
        }
    }

    func fetchAverageSteps(days: Int = 7) async {
        guard let type = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }

        let startDate = Calendar.current.date(byAdding: .day, value: -days, to: .now)!
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: .now, options: .strictEndDate)
        let descriptor = HKStatisticsQueryDescriptor(
            predicate: .init(value: predicate),
            options: .cumulativeSum
        )

        do {
            let result = try await descriptor.result(for: store)
            if let total = result?.sumQuantity()?.doubleValue(for: .count()) {
                averageSteps = total / Double(days)
            }
        } catch {
            averageSteps = nil
        }
    }

    func fetchAllData() async {
        await fetchRestingHeartRate()
        await fetchAverageSteps()
    }
}
