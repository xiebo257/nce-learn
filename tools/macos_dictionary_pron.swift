import Foundation
import CoreServices

func lookup(_ word: String) -> String? {
    let term = word as NSString
    guard let definition = DCSCopyTextDefinition(nil, term, CFRangeMake(0, term.length)) else {
        return nil
    }
    return definition.takeRetainedValue() as String
}

func americanPronunciation(from definition: String) -> String? {
    let pattern = #"AmE\s+([^|,;]+)"#
    guard let regex = try? NSRegularExpression(pattern: pattern) else {
        return nil
    }
    let range = NSRange(definition.startIndex..<definition.endIndex, in: definition)
    guard let match = regex.firstMatch(in: definition, range: range),
          let pronRange = Range(match.range(at: 1), in: definition) else {
        return nil
    }
    return String(definition[pronRange]).trimmingCharacters(in: .whitespacesAndNewlines)
}

let words = CommandLine.arguments.dropFirst()

if words.isEmpty {
    fputs("usage: swift tools/macos_dictionary_pron.swift word [word...]\n", stderr)
    exit(2)
}

var missing = false
for word in words {
    guard let definition = lookup(String(word)) else {
        print("\(word)\tNO_DEF")
        missing = true
        continue
    }

    if let am = americanPronunciation(from: definition) {
        print("\(word)\tAmE \(am)\t\(definition)")
    } else {
        print("\(word)\tNO_AME\t\(definition)")
        missing = true
    }
}

exit(missing ? 1 : 0)
