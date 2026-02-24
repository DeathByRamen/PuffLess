import Foundation
import SwiftData

@Model
final class NRTEntry {
    var date: Date
    var type: NRTType
    var dosageMg: Double
    var notes: String

    init(
        date: Date = .now,
        type: NRTType = .patch,
        dosageMg: Double = 21,
        notes: String = ""
    ) {
        self.date = date
        self.type = type
        self.dosageMg = dosageMg
        self.notes = notes
    }
}

enum NRTType: String, Codable, CaseIterable {
    case patch = "Patch"
    case gum = "Gum"
    case lozenge = "Lozenge"
    case other = "Other"

    var icon: String {
        switch self {
        case .patch: return "bandage"
        case .gum: return "mouth"
        case .lozenge: return "pills"
        case .other: return "cross.case"
        }
    }
}
