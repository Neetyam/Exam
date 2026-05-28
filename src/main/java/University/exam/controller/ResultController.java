package University.exam.controller;

import University.exam.Entity.Result;
import University.exam.service.ResultPdfService;
import University.exam.service.ResultService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.IOException;
import java.util.List;

@Controller
@RequestMapping("/admin/results")
public class ResultController {

    @Autowired
    private ResultService resultService;

    @Autowired
    private ResultPdfService resultPdfService;

    @GetMapping
    public String viewResults(
            @RequestParam(value = "division", required = false) String division,
            @RequestParam(value = "semester", required = false) String semester,
            @RequestParam(value = "subject", required = false) String subject,
            Model model) {
            
        model.addAttribute("adminName", "Super Admin");
        model.addAttribute("logoUrl", "/images/logo.png");
        
        List<Result> results = resultService.getFilteredResults(division, semester, subject);
        model.addAttribute("results", results != null ? results : java.util.Collections.emptyList());
        
        model.addAttribute("selectedDivision", division);
        model.addAttribute("selectedSemester", semester);
        model.addAttribute("selectedSubject", subject);

        List<String> distinctSubjects = resultService.getDistinctSubjects();
        model.addAttribute("distinctSubjects", distinctSubjects != null ? distinctSubjects : java.util.Collections.emptyList());
        
        List<String> distinctSemesters = resultService.getDistinctSemesters();
        model.addAttribute("distinctSemesters", distinctSemesters != null ? distinctSemesters : java.util.Collections.emptyList());
        
        List<String> distinctDivisions = resultService.getDistinctDivisions();
        model.addAttribute("distinctDivisions", distinctDivisions != null ? distinctDivisions : java.util.Collections.emptyList());

        return "admin/view_results";
    }

    @PostMapping("/filter")
    public String filterResults(
            @RequestParam(value = "division", required = false) String division,
            @RequestParam(value = "semester", required = false) String semester,
            @RequestParam(value = "subject", required = false) String subject,
            Model model) {
        
        model.addAttribute("adminName", "Super Admin");
        model.addAttribute("logoUrl", "/images/logo.png");
        
        List<Result> results = resultService.getFilteredResults(division, semester, subject);
        model.addAttribute("results", results != null ? results : java.util.Collections.emptyList());
        
        model.addAttribute("selectedDivision", division);
        model.addAttribute("selectedSemester", semester);
        model.addAttribute("selectedSubject", subject);

        List<String> distinctSubjects = resultService.getDistinctSubjects();
        model.addAttribute("distinctSubjects", distinctSubjects != null ? distinctSubjects : java.util.Collections.emptyList());
        
        List<String> distinctSemesters = resultService.getDistinctSemesters();
        model.addAttribute("distinctSemesters", distinctSemesters != null ? distinctSemesters : java.util.Collections.emptyList());
        
        List<String> distinctDivisions = resultService.getDistinctDivisions();
        model.addAttribute("distinctDivisions", distinctDivisions != null ? distinctDivisions : java.util.Collections.emptyList());
        
        return "admin/view_results";
    }

    @GetMapping("/pdf")
    public void downloadPdf(
            @RequestParam(value = "division", required = false) String division,
            @RequestParam(value = "semester", required = false) String semester,
            @RequestParam(value = "subject", required = false) String subject,
            HttpServletResponse response) throws IOException {

        List<Result> results = resultService.getFilteredResults(division, semester, subject);

        response.setContentType("application/pdf");
        String filename = "results";
        if (division != null && !division.isEmpty()) filename += "_" + division;
        if (semester != null && !semester.isEmpty()) filename += "_sem" + semester;
        filename += ".pdf";

        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=" + filename;
        response.setHeader(headerKey, headerValue);

        resultPdfService.generateResultPdf(response, results, subject, semester, division);
    }
}
