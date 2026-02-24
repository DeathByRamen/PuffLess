import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "wind")
                    .font(.system(size: 64))
                    .foregroundStyle(.teal)

                Text("PuffLess")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                Text("Track your progress.\nBreath by breath.")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .navigationTitle("PuffLess")
        }
    }
}

#Preview {
    ContentView()
}
