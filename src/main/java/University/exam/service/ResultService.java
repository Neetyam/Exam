package University.exam.service;

import University.exam.Entity.Result;
import University.exam.repository.ResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
public class ResultService {
    @Autowired
    private ResultRepository resultRepository;

    public List<Result> getFilteredResults(String division, String semester, String subjectName) {
        if (subjectName == null || subjectName.isEmpty() || semester == null || semester.isEmpty()) {
            // Require at least subject and semester to be selected
            return java.util.Collections.emptyList();
        }
        
        if (division != null && !division.isEmpty()) {
            return resultRepository.findBySubjectAndSemesterAndDivision(subjectName, semester, division);
        } else {
            return resultRepository.findBySubjectAndSemester(subjectName, semester);
        }
    }

    public List<String> getDistinctSubjects() {
        return resultRepository.findDistinctSubjectNames();
    }

    public List<String> getDistinctSemesters() {
        return resultRepository.findDistinctSemesters();
    }

    public List<String> getDistinctDivisions() {
        return resultRepository.findDistinctDivisions();
    }
}
